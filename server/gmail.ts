// Gmail Integration for DivyanshiSolar
// Uses Replit's Gmail connection for secure email sending

import { google } from 'googleapis';

let connectionSettings: any;

async function getAccessToken() {
  if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-mail',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Gmail connection fetch failed: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  connectionSettings = data.items?.[0];

  const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Gmail not connected');
  }
  return accessToken;
}

async function getUncachableGmailClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.gmail({ version: 'v1', auth: oauth2Client });
}

function createEmailMessage(to: string, subject: string, htmlContent: string, fromName: string = 'Divyanshi Solar', pdfAttachment?: { filename: string; data: string }): string {
  const fromEmail = connectionSettings?.settings?.email || 'noreply@divyanshisolar.com';
  const boundary = '----=_Part_' + Date.now().toString(36);
  
  let messageParts: string[];
  
  if (pdfAttachment) {
    messageParts = [
      `From: ${fromName} <${fromEmail}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: 7bit',
      '',
      htmlContent,
      '',
      `--${boundary}`,
      'Content-Type: application/pdf',
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${pdfAttachment.filename}"`,
      '',
      pdfAttachment.data,
      '',
      `--${boundary}--`
    ];
  } else {
    messageParts = [
      `From: ${fromName} <${fromEmail}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlContent
    ];
  }
  
  const message = messageParts.join('\r\n');
  
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export interface EmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  fromName?: string;
  pdfAttachment?: {
    filename: string;
    data: string;  // Base64 encoded PDF data
  };
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log('Attempting to send email to:', options.to);
    
    const gmail = await getUncachableGmailClient();
    console.log('Gmail client obtained successfully');
    
    const encodedMessage = createEmailMessage(
      options.to,
      options.subject,
      options.htmlContent,
      options.fromName,
      options.pdfAttachment
    );
    
    console.log('Sending email via Gmail API...');
    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });
    
    console.log('Email sent successfully, messageId:', response.data.id);
    return {
      success: true,
      messageId: response.data.id || undefined
    };
  } catch (error: any) {
    console.error('Gmail send error:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send email';
    if (error.message?.includes('Gmail not connected')) {
      errorMessage = 'Gmail is not connected. Please reconnect your Gmail account.';
    } else if (error.message?.includes('invalid_grant')) {
      errorMessage = 'Gmail authorization expired. Please reconnect your Gmail account.';
    } else if (error.message?.includes('X_REPLIT_TOKEN')) {
      errorMessage = 'Authentication issue. Please try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

export function createProposalEmailTemplate(customerName: string, capacity: number, netCost: number, subsidy: number, partnerName?: string): string {
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Solar Proposal from Divyanshi Solar</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #FF6600; padding: 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Divyanshi Solar</h1>
              <p style="color: #ffffff; margin: 10px 0 0; font-size: 14px;">PM Surya Ghar Yojana Authorized Partner</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #333333; margin: 0 0 20px;">Dear ${customerName},</h2>
              
              <p style="color: #666666; line-height: 1.6; margin: 0 0 20px;">
                Thank you for your interest in going solar with Divyanshi Solar! We are pleased to share your personalized solar proposal.
              </p>
              
              <!-- Proposal Summary Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFF5EE; border-radius: 8px; margin: 20px 0; border: 1px solid #FFCC99;">
                <tr>
                  <td style="padding: 25px;">
                    <h3 style="color: #FF6600; margin: 0 0 15px; font-size: 18px;">Your System Summary</h3>
                    
                    <table width="100%" cellpadding="8" cellspacing="0">
                      <tr>
                        <td style="color: #666666;">System Capacity:</td>
                        <td style="color: #333333; font-weight: bold; text-align: right;">${capacity} kWp</td>
                      </tr>
                      <tr>
                        <td style="color: #666666;">Government Subsidy:</td>
                        <td style="color: #228B22; font-weight: bold; text-align: right;">${formatINR(subsidy)}</td>
                      </tr>
                      <tr style="border-top: 1px solid #FFCC99;">
                        <td style="color: #FF6600; font-weight: bold; padding-top: 15px;">Net Investment:</td>
                        <td style="color: #FF6600; font-weight: bold; text-align: right; padding-top: 15px; font-size: 20px;">${formatINR(netCost)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="color: #666666; line-height: 1.6; margin: 20px 0;">
                Your detailed proposal PDF is attached to this email. It includes complete system specifications, financial analysis, EMI options, and environmental impact.
              </p>
              
              <!-- Benefits -->
              <h3 style="color: #333333; margin: 25px 0 15px;">Why Go Solar Now?</h3>
              <ul style="color: #666666; line-height: 1.8; padding-left: 20px; margin: 0;">
                <li>Up to Rs 78,000 government subsidy under PM Surya Ghar Yojana</li>
                <li>Reduce your electricity bills to near zero</li>
                <li>25-year performance warranty</li>
                <li>Easy EMI options available</li>
                <li>Free site survey and installation support</li>
              </ul>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="https://divyanshisolar.com" style="display: inline-block; background-color: #FF6600; color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 5px; font-weight: bold; font-size: 16px;">Schedule Free Site Survey</a>
                  </td>
                </tr>
              </table>
              
              ${partnerName ? `
              <div style="background-color: #E8F5E9; border-left: 4px solid #228B22; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="color: #228B22; margin: 0; font-weight: bold;">Your District Partner</p>
                <p style="color: #333333; margin: 8px 0 0; font-size: 16px;">Contact <strong>${partnerName}</strong> for further installation process and site survey.</p>
              </div>
              ` : ''}
              
              <p style="color: #666666; line-height: 1.6; margin: 20px 0 0;">
                If you have any questions, feel free to reach out to us. We're here to help you on your solar journey!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #333333; padding: 25px 40px; text-align: center;">
              <p style="color: #ffffff; margin: 0 0 10px; font-size: 14px;">Divyanshi Digital Services Pvt. Ltd.</p>
              <p style="color: #999999; margin: 0; font-size: 12px;">
                www.divyanshisolar.com | info@divyanshisolar.com
              </p>
              <p style="color: #999999; margin: 10px 0 0; font-size: 11px;">
                PM Surya Ghar Yojana Authorized Partner
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function createWelcomeEmailTemplate(customerName: string, partnerName?: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <tr>
            <td style="background-color: #FF6600; padding: 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0;">Welcome to Divyanshi Solar!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #333333; margin: 0 0 20px;">Dear ${customerName},</h2>
              <p style="color: #666666; line-height: 1.6;">
                Thank you for registering with Divyanshi Solar! We are excited to help you join India's clean energy revolution under the PM Surya Ghar Yojana program.
              </p>
              ${partnerName ? `<p style="color: #666666; line-height: 1.6;">Your dedicated partner <strong>${partnerName}</strong> will contact you shortly to discuss your solar requirements.</p>` : ''}
              <p style="color: #666666; line-height: 1.6;">
                Our team will reach out to you soon for a free site survey.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #333333; padding: 20px; text-align: center;">
              <p style="color: #999999; margin: 0; font-size: 12px;">www.divyanshisolar.com</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
