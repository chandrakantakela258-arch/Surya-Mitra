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
  private smsProvider: "twilio" | "fast2sms";
  private resendApiKey: string | undefined;
  private fromEmail: string;

  constructor() {
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.fast2smsApiKey = process.env.FAST2SMS_API_KEY;
    this.smsProvider = (process.env.SMS_PROVIDER as "twilio" | "fast2sms") || "fast2sms";
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

  async sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
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

      console.log(`WhatsApp message sent to ${formattedPhone}`);
      return true;
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
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

  async sendOTP(to: string, otp: string): Promise<boolean> {
    if (this.smsProvider === "fast2sms" && this.fast2smsApiKey) {
      return this.sendOTPViaFast2SMS(to, otp);
    }
    return this.sendSMS(to, `Your DivyanshiSolar verification code is: ${otp}`);
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

  isConfigured(): { twilio: boolean; resend: boolean } {
    return {
      twilio: !!(this.twilioAccountSid && this.twilioAuthToken && this.twilioPhoneNumber),
      resend: !!this.resendApiKey,
    };
  }
}

export const notificationService = new NotificationService();
