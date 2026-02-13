import { db } from "./db";
import { notifications, userPreferences, users, customers } from "@shared/schema";
import { eq } from "drizzle-orm";

interface NotificationData {
  userId: string;
  customerId?: string;
  type: "status_update" | "milestone_complete" | "commission_earned" | "general";
  title: string;
  message: string;
}

interface CustomerStatusNotification {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  ddpId: string;
  oldStatus: string;
  newStatus: string;
}

const statusMessages: Record<string, { title: string; description: string }> = {
  pending: {
    title: "Application Received",
    description: "Your solar panel application has been submitted and is pending review.",
  },
  verified: {
    title: "Application Verified",
    description: "Your application has been verified. We will proceed with the approval process.",
  },
  approved: {
    title: "Application Approved",
    description: "Congratulations! Your solar panel installation has been approved. Our team will contact you for scheduling.",
  },
  installation_scheduled: {
    title: "Installation Scheduled",
    description: "Your solar panel installation has been scheduled. Our technical team will arrive as per the scheduled date.",
  },
  completed: {
    title: "Installation Completed",
    description: "Your solar panel installation is complete! Enjoy clean, renewable energy and reduced electricity bills.",
  },
};

export class NotificationService {
  private twilioAccountSid: string | undefined;
  private twilioAuthToken: string | undefined;
  private twilioPhoneNumber: string | undefined;
  private fast2smsApiKey: string | undefined;
  private aisensyApiKey: string | undefined;
  private cunnektApiKey: string | undefined;
  private smsProvider: "twilio" | "fast2sms";
  private whatsappProvider: "twilio" | "aisensy" | "cunnekt";
  private resendApiKey: string | undefined;
  private fromEmail: string;

  constructor() {
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.fast2smsApiKey = process.env.FAST2SMS_API_KEY;
    this.aisensyApiKey = process.env.AISENSY_API_KEY;
    this.cunnektApiKey = process.env.CUNNEKT_API_KEY;
    this.smsProvider = (process.env.SMS_PROVIDER as "twilio" | "fast2sms") || "fast2sms";
    this.whatsappProvider = (process.env.WHATSAPP_PROVIDER as "twilio" | "aisensy" | "cunnekt") || "cunnekt";
    this.resendApiKey = process.env.RESEND_API_KEY;
    this.fromEmail = process.env.FROM_EMAIL || "notifications@divyanshisolar.com";
  }

  private formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      cleaned = "91" + cleaned;
    }
    if (!cleaned.startsWith("+")) {
      cleaned = "+" + cleaned;
    }
    return cleaned;
  }

  async sendWhatsAppMessage(to: string, message: string, campaignName?: string, templateParams?: string[], userName?: string, imageUrl?: string): Promise<boolean> {
    if (this.whatsappProvider === "cunnekt") {
      return this.sendWhatsAppViaCunnekt(to, message, campaignName, templateParams, imageUrl);
    }
    if (this.whatsappProvider === "aisensy") {
      return this.sendWhatsAppViaAiSensy(to, message, campaignName, templateParams, userName);
    }
    return this.sendWhatsAppViaTwilio(to, message);
  }

  private async sendWhatsAppViaAiSensy(to: string, message: string, campaignName?: string, templateParams?: string[], userName?: string): Promise<boolean> {
    console.log("[AiSensy] sendWhatsAppViaAiSensy called with:", { to, campaignName, userName });
    console.log("[AiSensy] API key configured:", !!this.aisensyApiKey, "Key length:", this.aisensyApiKey?.length || 0);
    
    if (!this.aisensyApiKey) {
      console.error("[AiSensy] WhatsApp notification skipped - AISENSY_API_KEY not configured");
      return false;
    }

    try {
      // Format phone number - remove all non-digits, add 91 prefix if needed (no + sign for AiSensy)
      let phoneNumber = to.replace(/\D/g, "");
      if (phoneNumber.length === 10) {
        phoneNumber = "91" + phoneNumber;
      }
      // Remove leading + if present (AiSensy expects just digits)
      if (phoneNumber.startsWith("+")) {
        phoneNumber = phoneNumber.substring(1);
      }

      // Build the complete AiSensy API request body as per their v2 API spec
      // Default campaign is "Divyanshi_Partner_Meeting" which uses the divyanshi_solar_google_meeting template
      const requestBody = {
        apiKey: this.aisensyApiKey,
        campaignName: campaignName || "Divyanshi_Partner_Meeting",
        destination: phoneNumber,
        userName: userName || "Divyanshi digital service pvt ltd",
        templateParams: templateParams || [],
        source: "divyanshi_solar_app",
        media: {},
        buttons: [],
        carouselCards: [],
        location: {},
        attributes: {},
        paramsFallbackValue: {}
      };

      console.log("[AiSensy] Sending WhatsApp to:", phoneNumber, "Campaign:", requestBody.campaignName);
      console.log("[AiSensy] Request body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch("https://backend.aisensy.com/campaign/t1/api/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log("[AiSensy] Response status:", response.status);
      console.log("[AiSensy] Response body:", responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        console.error("[AiSensy] Failed to parse response as JSON");
        return false;
      }
      
      // AiSensy returns success as string "true" not boolean
      if (!response.ok || responseData.status === "error" || (responseData.success !== true && responseData.success !== "true")) {
        console.error("[AiSensy] WhatsApp error:", JSON.stringify(responseData));
        return false;
      }

      console.log(`[AiSensy] WhatsApp message sent successfully to ${phoneNumber}, message_id: ${responseData.submitted_message_id}`);
      return true;
    } catch (error) {
      console.error("[AiSensy] Error sending WhatsApp:", error);
      return false;
    }
  }

  private formatCunnektPhone(phone: string): string {
    let phoneNumber = phone.replace(/\D/g, "");
    if (phoneNumber.length === 10) {
      phoneNumber = "91" + phoneNumber;
    }
    if (phoneNumber.startsWith("+")) {
      phoneNumber = phoneNumber.substring(1);
    }
    return phoneNumber;
  }

  private async sendWhatsAppViaCunnekt(to: string, message: string, templateId?: string, templateParams?: string[], imageUrl?: string): Promise<boolean> {
    const apiKey = process.env.CUNNEKT_API_KEY || this.cunnektApiKey;
    if (!apiKey) {
      console.error("[Cunnekt] WhatsApp notification skipped - CUNNEKT_API_KEY not configured");
      return false;
    }
    this.cunnektApiKey = apiKey;

    try {
      const phoneNumber = this.formatCunnektPhone(to);
      
      if (templateId) {
        return this.sendCunnektNotificationMessage(phoneNumber, templateId, templateParams, imageUrl);
      }
      
      return this.sendCunnektDirectMessage(phoneNumber, message);
    } catch (error) {
      console.error("[Cunnekt] Error sending WhatsApp:", error);
      return false;
    }
  }

  private async sendCunnektNotificationMessage(phoneNumber: string, templateId: string, templateParams?: string[], imageUrl?: string): Promise<boolean> {
    try {
      const requestBody: any = {
        mobile: phoneNumber,
        templateid: templateId,
      };

      const components: any[] = [];

      if (imageUrl) {
        components.push({
          type: "header",
          parameters: [{
            type: "image",
            image: {
              link: imageUrl,
            },
          }],
        });
      }

      if (templateParams && templateParams.length > 0) {
        components.push({
          type: "body",
          parameters: templateParams.map(param => ({
            type: "text",
            text: param,
          })),
        });
      }

      if (components.length > 0) {
        requestBody.template = { components };
      }

      console.log("[Cunnekt] Sending notification to:", phoneNumber, "Template:", templateId, "Image:", imageUrl || "none");
      console.log("[Cunnekt] Request body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch("https://app2.cunnekt.com/v1/sendnotification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "API-KEY": this.cunnektApiKey!,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log("[Cunnekt] Notification response status:", response.status);
      console.log("[Cunnekt] Notification response body:", responseText);

      if (!response.ok) {
        console.error("[Cunnekt] Notification error:", responseText);
        return false;
      }

      console.log(`[Cunnekt] Notification sent successfully to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error("[Cunnekt] Error sending notification:", error);
      return false;
    }
  }

  private async sendCunnektDirectMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const requestBody = {
        mobile: phoneNumber,
        message: message,
        type: "text",
      };

      console.log("[Cunnekt] Sending message to:", phoneNumber);

      const response = await fetch("https://app2.cunnekt.com/v1/sendreplymessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "API-KEY": this.cunnektApiKey!,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log("[Cunnekt] Response status:", response.status);
      console.log("[Cunnekt] Response body:", responseText);

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        console.error("[Cunnekt] Failed to parse response as JSON");
        return response.ok;
      }

      if (!response.ok) {
        console.error("[Cunnekt] Message error:", JSON.stringify(responseData));
        return false;
      }

      console.log(`[Cunnekt] Message sent successfully to ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error("[Cunnekt] Error sending message:", error);
      return false;
    }
  }

  async sendCunnektNotification(phoneNumber: string, templateId: string, templateParams?: string[]): Promise<boolean> {
    if (!this.cunnektApiKey) {
      console.error("[Cunnekt] Notification skipped - CUNNEKT_API_KEY not configured");
      return false;
    }

    try {
      const formattedPhone = this.formatCunnektPhone(phoneNumber);
      const requestBody: any = {
        mobile: formattedPhone,
        templateid: templateId,
      };

      if (templateParams && templateParams.length > 0) {
        requestBody.template = {
          components: [
            {
              type: "body",
              parameters: templateParams.map(param => ({
                type: "text",
                text: param,
              })),
            },
          ],
        };
      }

      console.log("[Cunnekt] Sending notification to:", formattedPhone, "Template:", templateId);

      const response = await fetch("https://app2.cunnekt.com/v1/sendnotification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "API-KEY": this.cunnektApiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log("[Cunnekt] Notification response:", response.status, responseText);

      if (!response.ok) {
        console.error("[Cunnekt] Notification error:", responseText);
        return false;
      }

      console.log(`[Cunnekt] Notification sent successfully to ${formattedPhone}`);
      return true;
    } catch (error) {
      console.error("[Cunnekt] Error sending notification:", error);
      return false;
    }
  }

  async sendCunnektMediaMessage(phoneNumber: string, mediaType: "image" | "video" | "document", mediaUrl: string, caption?: string, fileName?: string): Promise<boolean> {
    if (!this.cunnektApiKey) {
      console.error("[Cunnekt] Media message skipped - CUNNEKT_API_KEY not configured");
      return false;
    }

    try {
      const formattedPhone = this.formatCunnektPhone(phoneNumber);
      const requestBody: any = {
        mobile: formattedPhone,
        type: mediaType,
      };

      if (mediaType === "image") {
        requestBody.image = { link: mediaUrl };
        if (caption) requestBody.image.caption = caption;
      } else if (mediaType === "video") {
        requestBody.video = { link: mediaUrl };
        if (caption) requestBody.video.caption = caption;
      } else if (mediaType === "document") {
        requestBody.document = { link: mediaUrl };
        if (fileName) requestBody.document.filename = fileName;
        if (caption) requestBody.document.caption = caption;
      }

      console.log("[Cunnekt] Sending media message to:", formattedPhone, "Type:", mediaType);

      const response = await fetch("https://app2.cunnekt.com/v1/sendreplymessage", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "API-KEY": this.cunnektApiKey,
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();
      console.log("[Cunnekt] Media response:", response.status, responseText);

      if (!response.ok) {
        console.error("[Cunnekt] Media message error:", responseText);
        return false;
      }

      console.log(`[Cunnekt] Media message sent successfully to ${formattedPhone}`);
      return true;
    } catch (error) {
      console.error("[Cunnekt] Error sending media message:", error);
      return false;
    }
  }

  private async sendWhatsAppViaTwilio(to: string, message: string): Promise<boolean> {
    if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioPhoneNumber) {
      console.log("WhatsApp notification skipped - Twilio not configured");
      return false;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(to);
      const twilioWhatsAppNumber = `whatsapp:${this.twilioPhoneNumber}`;
      const recipientWhatsApp = `whatsapp:${formattedPhone}`;

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString("base64")}`,
          },
          body: new URLSearchParams({
            From: twilioWhatsAppNumber,
            To: recipientWhatsApp,
            Body: message,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Twilio WhatsApp error:", errorData);
        return false;
      }

      console.log(`WhatsApp message sent to ${formattedPhone} via Twilio`);
      return true;
    } catch (error) {
      console.error("Error sending WhatsApp via Twilio:", error);
      return false;
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    if (this.smsProvider === "fast2sms") {
      return this.sendSMSViaFast2SMS(to, message);
    }
    return this.sendSMSViaTwilio(to, message);
  }

  private async sendSMSViaFast2SMS(to: string, message: string): Promise<boolean> {
    if (!this.fast2smsApiKey) {
      console.log("SMS notification skipped - Fast2SMS not configured");
      return false;
    }

    try {
      let phoneNumber = to.replace(/\D/g, "");
      if (phoneNumber.startsWith("91") && phoneNumber.length === 12) {
        phoneNumber = phoneNumber.substring(2);
      }
      if (phoneNumber.length !== 10) {
        console.error("Invalid phone number format for Fast2SMS:", to);
        return false;
      }

      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          "authorization": this.fast2smsApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "q",
          message: message,
          language: "english",
          flash: 0,
          numbers: phoneNumber,
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok || responseData.return === false) {
        console.error("Fast2SMS error:", responseData);
        return false;
      }

      console.log(`SMS sent to ${phoneNumber} via Fast2SMS`);
      return true;
    } catch (error) {
      console.error("Error sending SMS via Fast2SMS:", error);
      return false;
    }
  }

  async sendOTP(to: string, otp: string, channel: "sms" | "whatsapp" = "sms"): Promise<boolean> {
    if (channel === "whatsapp") {
      return this.sendWhatsAppOTP(to, otp);
    }
    if (this.smsProvider === "fast2sms" && this.fast2smsApiKey) {
      return this.sendOTPViaFast2SMS(to, otp);
    }
    return this.sendSMS(to, `Your DivyanshiSolar verification code is: ${otp}`);
  }

  async sendWhatsAppOTP(to: string, otp: string): Promise<boolean> {
    if (this.whatsappProvider === "cunnekt" && this.cunnektApiKey) {
      return this.sendWhatsAppMessage(to, otp, "otp_verification", [otp]);
    }
    if (this.whatsappProvider === "aisensy" && this.aisensyApiKey) {
      return this.sendWhatsAppMessage(to, otp, "otp_verification", [otp]);
    }
    return this.sendWhatsAppMessage(to, `Your DivyanshiSolar verification code is: ${otp}`);
  }

  private async sendOTPViaFast2SMS(to: string, otp: string): Promise<boolean> {
    if (!this.fast2smsApiKey) {
      console.log("OTP notification skipped - Fast2SMS not configured");
      return false;
    }

    try {
      let phoneNumber = to.replace(/\D/g, "");
      if (phoneNumber.startsWith("91") && phoneNumber.length === 12) {
        phoneNumber = phoneNumber.substring(2);
      }
      if (phoneNumber.length !== 10) {
        console.error("Invalid phone number format for Fast2SMS OTP:", to);
        return false;
      }

      const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          "authorization": this.fast2smsApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: otp,
          numbers: phoneNumber,
        }),
      });

      const responseData = await response.json();
      
      if (!response.ok || responseData.return === false) {
        console.error("Fast2SMS OTP error:", responseData);
        return false;
      }

      console.log(`OTP sent to ${phoneNumber} via Fast2SMS`);
      return true;
    } catch (error) {
      console.error("Error sending OTP via Fast2SMS:", error);
      return false;
    }
  }

  private async sendSMSViaTwilio(to: string, message: string): Promise<boolean> {
    if (!this.twilioAccountSid || !this.twilioAuthToken || !this.twilioPhoneNumber) {
      console.log("SMS notification skipped - Twilio not configured");
      return false;
    }

    try {
      const formattedPhone = this.formatPhoneNumber(to);

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.twilioAccountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${Buffer.from(`${this.twilioAccountSid}:${this.twilioAuthToken}`).toString("base64")}`,
          },
          body: new URLSearchParams({
            From: this.twilioPhoneNumber,
            To: formattedPhone,
            Body: message,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Twilio SMS error:", errorData);
        return false;
      }

      console.log(`SMS sent to ${formattedPhone} via Twilio`);
      return true;
    } catch (error) {
      console.error("Error sending SMS via Twilio:", error);
      return false;
    }
  }

  async sendEmail(to: string, subject: string, htmlContent: string): Promise<boolean> {
    if (!this.resendApiKey) {
      console.log("Email notification skipped - Resend not configured");
      return false;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.resendApiKey}`,
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [to],
          subject: subject,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Resend email error:", errorData);
        return false;
      }

      console.log(`Email sent to ${to}`);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }

  async createInAppNotification(data: NotificationData): Promise<void> {
    try {
      await db.insert(notifications).values({
        userId: data.userId,
        customerId: data.customerId,
        type: data.type,
        title: data.title,
        message: data.message,
        isRead: "false",
        channel: "in_app",
      });
    } catch (error) {
      console.error("Error creating in-app notification:", error);
    }
  }

  private generateEmailHtml(title: string, description: string, customerName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
          <div style="text-align: center; padding: 20px 0; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Divyanshi Solar</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">PM Surya Ghar Yojana Partner</p>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin-bottom: 10px;">${title}</h2>
            <p style="color: #666; margin-bottom: 20px;">Dear ${customerName},</p>
            <p style="color: #666; margin-bottom: 20px;">${description}</p>
            
            <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #9a3412; font-size: 14px;">
                <strong>Need help?</strong> Contact your local partner or reach us at support@divyanshisolar.com
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Divyanshi Digital Services Pvt. Ltd.<br>
              PM Surya Ghar Yojana - Rooftop Solar Installation
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateWhatsAppMessage(title: string, description: string, customerName: string): string {
    return `*Divyanshi Solar - PM Surya Ghar Yojana*

*${title}*

Dear ${customerName},

${description}

For any queries, contact your local partner.

_Thank you for choosing Divyanshi Solar!_`;
  }

  async notifyCustomerStatusChange(data: CustomerStatusNotification): Promise<{
    whatsapp: boolean;
    sms: boolean;
    email: boolean;
    inApp: boolean;
  }> {
    const statusInfo = statusMessages[data.newStatus] || {
      title: "Application Status Updated",
      description: `Your application status has been updated to: ${data.newStatus}`,
    };

    const results = {
      whatsapp: false,
      sms: false,
      email: false,
      inApp: false,
    };

    const [ddp] = await db.select().from(users).where(eq(users.id, data.ddpId));
    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, data.ddpId));

    const whatsAppMessage = this.generateWhatsAppMessage(
      statusInfo.title,
      statusInfo.description,
      data.customerName
    );

    if (prefs?.whatsappNotifications === "true" || !prefs) {
      results.whatsapp = await this.sendWhatsAppMessage(data.customerPhone, whatsAppMessage);
    }

    if ((prefs?.smsNotifications === "true" || !prefs) && !results.whatsapp) {
      results.sms = await this.sendSMS(data.customerPhone, 
        `Divyanshi Solar: ${statusInfo.title} - ${statusInfo.description.substring(0, 100)}...`
      );
    }

    if ((prefs?.emailNotifications === "true" || !prefs) && data.customerEmail) {
      const emailHtml = this.generateEmailHtml(statusInfo.title, statusInfo.description, data.customerName);
      results.email = await this.sendEmail(
        data.customerEmail,
        `Divyanshi Solar: ${statusInfo.title}`,
        emailHtml
      );
    }

    await this.createInAppNotification({
      userId: data.ddpId,
      customerId: data.customerId,
      type: "status_update",
      title: statusInfo.title,
      message: `Customer ${data.customerName}'s application status changed from ${data.oldStatus} to ${data.newStatus}`,
    });
    results.inApp = true;

    if (ddp?.parentId) {
      await this.createInAppNotification({
        userId: ddp.parentId,
        customerId: data.customerId,
        type: "status_update",
        title: statusInfo.title,
        message: `Customer ${data.customerName}'s application status changed to ${data.newStatus} (via ${ddp.name})`,
      });
    }

    console.log(`Notifications sent for customer ${data.customerName}:`, results);
    return results;
  }

  async notifyCommissionEarned(
    partnerId: string,
    partnerPhone: string,
    partnerEmail: string | undefined,
    amount: number,
    source: string,
    customerName?: string
  ): Promise<void> {
    const formattedAmount = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

    const title = "Commission Earned!";
    const message = customerName
      ? `You earned ${formattedAmount} commission for ${source} (Customer: ${customerName})`
      : `You earned ${formattedAmount} commission for ${source}`;

    await this.createInAppNotification({
      userId: partnerId,
      type: "commission_earned",
      title,
      message,
    });

    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, partnerId));

    if (prefs?.whatsappNotifications === "true" || !prefs) {
      await this.sendWhatsAppMessage(
        partnerPhone,
        `*Divyanshi Solar*\n\n${title}\n\n${message}\n\n_Keep up the great work!_`
      );
    }

    if ((prefs?.emailNotifications === "true" || !prefs) && partnerEmail) {
      const emailHtml = this.generateEmailHtml(title, message, "Partner");
      await this.sendEmail(partnerEmail, `Divyanshi Solar: ${title}`, emailHtml);
    }
  }

  async notifyMilestoneComplete(
    customerId: string,
    customerName: string,
    customerPhone: string,
    customerEmail: string | undefined,
    milestoneName: string,
    ddpId: string
  ): Promise<void> {
    const title = "Milestone Completed";
    const message = `Your solar installation has reached a new milestone: ${milestoneName}`;

    await this.createInAppNotification({
      userId: ddpId,
      customerId,
      type: "milestone_complete",
      title,
      message: `Customer ${customerName} completed milestone: ${milestoneName}`,
    });

    const [prefs] = await db.select().from(userPreferences).where(eq(userPreferences.userId, ddpId));

    if (prefs?.whatsappNotifications === "true" || !prefs) {
      await this.sendWhatsAppMessage(
        customerPhone,
        this.generateWhatsAppMessage(title, message, customerName)
      );
    }

    if ((prefs?.emailNotifications === "true" || !prefs) && customerEmail) {
      const emailHtml = this.generateEmailHtml(title, message, customerName);
      await this.sendEmail(customerEmail, `Divyanshi Solar: ${title}`, emailHtml);
    }
  }

  isConfigured(): { twilio: boolean; resend: boolean; aisensy: boolean; fast2sms: boolean; cunnekt: boolean } {
    return {
      twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER),
      resend: !!process.env.RESEND_API_KEY,
      aisensy: !!process.env.AISENSY_API_KEY,
      fast2sms: !!process.env.FAST2SMS_API_KEY,
      cunnekt: !!process.env.CUNNEKT_API_KEY,
    };
  }

  // Send bulk WhatsApp messages to multiple recipients
  async sendBulkWhatsApp(
    recipients: Array<{ phone: string; name: string }>,
    message: string,
    templateId?: string,
    templateParams?: string[],
    imageUrl?: string
  ): Promise<{ sent: number; failed: number; results: Array<{ phone: string; name: string; success: boolean }> }> {
    const results: Array<{ phone: string; name: string; success: boolean }> = [];
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      try {
        if (results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const personalizedParams = templateParams?.map(p => 
          p.replace(/\{\{name\}\}/g, recipient.name)
        );

        const success = await this.sendWhatsAppMessage(
          recipient.phone,
          message.replace(/\{\{name\}\}/g, recipient.name),
          templateId || undefined,
          personalizedParams || [],
          "Divyanshi digital service pvt ltd",
          imageUrl
        );

        results.push({ phone: recipient.phone, name: recipient.name, success });
        if (success) {
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to send WhatsApp to ${recipient.phone}:`, error);
        results.push({ phone: recipient.phone, name: recipient.name, success: false });
        failed++;
      }
    }

    console.log(`[AiSensy] Bulk WhatsApp sent: ${sent} success, ${failed} failed out of ${recipients.length}`);
    return { sent, failed, results };
  }

  // Send bulk emails to multiple recipients
  async sendBulkEmail(
    recipients: Array<{ email: string; name: string }>,
    subject: string,
    message: string
  ): Promise<{ sent: number; failed: number; results: Array<{ email: string; name: string; success: boolean }> }> {
    const results: Array<{ email: string; name: string; success: boolean }> = [];
    let sent = 0;
    let failed = 0;

    for (const recipient of recipients) {
      try {
        // Add small delay between messages to avoid rate limiting
        if (results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        const personalizedMessage = message.replace(/\{\{name\}\}/g, recipient.name);
        const htmlContent = this.generateBroadcastEmailHtml(subject, personalizedMessage, recipient.name);
        const success = await this.sendEmail(recipient.email, subject, htmlContent);

        results.push({ email: recipient.email, name: recipient.name, success });
        if (success) {
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        results.push({ email: recipient.email, name: recipient.name, success: false });
        failed++;
      }
    }

    console.log(`Bulk email sent: ${sent} success, ${failed} failed out of ${recipients.length}`);
    return { sent, failed, results };
  }

  private generateBroadcastEmailHtml(title: string, message: string, partnerName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
          <div style="text-align: center; padding: 20px 0; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-radius: 8px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Divyanshi Solar</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">PM Surya Ghar Yojana Partner Network</p>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin-bottom: 10px;">${title}</h2>
            <p style="color: #666; margin-bottom: 20px;">Dear ${partnerName},</p>
            <div style="color: #666; margin-bottom: 20px; white-space: pre-line;">${message}</div>
            
            <div style="background-color: #fff7ed; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #9a3412; font-size: 14px;">
                <strong>Important:</strong> This is an official communication from Divyanshi Solar admin team.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              Divyanshi Digital Services Pvt. Ltd.<br>
              PM Surya Ghar Yojana - Rooftop Solar Installation
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const notificationService = new NotificationService();
