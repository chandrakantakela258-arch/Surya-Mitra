import axios from 'axios';
import { db } from './db';
import { storage } from './storage';
import { whatsappLeads } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Translations
const t = (lang: string, en: string, hi: string) => lang === 'hi' ? hi : en;

// Send WhatsApp text or interactive message
const sendWhatsAppMessage = async (to: string, text: string, buttons: string[] | null = null, options: string[] | null = null) => {
  let messageData: any = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
  };

  if (buttons) {
    messageData.type = "interactive";
    messageData.interactive = {
      type: "button",
      body: { text: text },
      action: {
        buttons: buttons.map((btn, index) => ({
          type: "reply",
          reply: { id: `btn_${index}`, title: btn }
        }))
      }
    };
  } else if (options) {
    messageData.type = "interactive";
    messageData.interactive = {
      type: "list",
      header: { type: "text", text: "Please Select" },
      body: { text: text },
      footer: { text: "Divyanshi Solar" },
      action: {
        button: "Options",
        sections: [
          {
            title: "Options List",
            rows: options.map((opt, index) => ({
              id: `opt_${index}`,
              title: opt.substring(0, 24), // Meta restricts title length
            }))
          }
        ]
      }
    };
  } else {
    messageData.type = "text";
    messageData.text = { body: text };
  }

  try {
    const phoneNumberId = await storage.getAdminSetting('PHONE_NUMBER_ID') || process.env.PHONE_NUMBER_ID;
    const accessToken = await storage.getAdminSetting('META_ACCESS_TOKEN') || process.env.META_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      console.warn("Missing Meta WhatsApp API credentials in Admin Settings or Environment Variables.");
      return;
    }

    await axios.post(
      `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
      messageData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (err: any) {
    console.error('Meta API Error:', err.response?.data || err.message);
  }
};

const getLead = async (phone: string) => {
  const result = await db.select().from(whatsappLeads).where(eq(whatsappLeads.phone, phone)).limit(1);
  return result[0] || null;
};

const createOrUpdateLead = async (phone: string, data: Partial<typeof whatsappLeads.$inferInsert>) => {
  const existing = await getLead(phone);
  
  if (!existing) {
    // Create new
    await db.insert(whatsappLeads).values({ ...data, phone });
  } else {
    // Update
    data.updatedAt = new Date();
    await db.update(whatsappLeads).set(data).where(eq(whatsappLeads.phone, phone));
  }
};

export const processMessage = async (phone: string, text: string) => {
  // Fetch user state
  let lead = await getLead(phone);
  
  if (!lead) {
      // New user, push to DB and send Language prompt
      await createOrUpdateLead(phone, { currentStep: "0" });
      await sendWhatsAppMessage(phone, 'Please select your preferred language / कृपया अपनी पसंदीदा भाषा चुनें:', ['English', 'हिन्दी']);
      return;
  }

  let stepStr = lead.currentStep || "0";
  let step = parseFloat(stepStr);
  let lang = lead.language || "en";

  switch (step) {
    case 0:
      lang = text === 'हिन्दी' ? 'hi' : 'en';
      await createOrUpdateLead(phone, { language: lang, currentStep: "1" });
      await sendWhatsAppMessage(phone, t(lang, 'Question 1: What is your Name?', 'प्रश्न 1: आपका नाम क्या है?'));
      break;

    case 1:
      await createOrUpdateLead(phone, { name: text, currentStep: "1.1" });
      await sendWhatsAppMessage(phone, t(lang, 'Please enter your 10-digit Mobile Number:', 'कृपया अपना 10-अंकीय मोबाइल नंबर दर्ज करें:'));
      break;
      
    case 1.1:
      await createOrUpdateLead(phone, { currentStep: "1.2" });
      await sendWhatsAppMessage(phone, t(lang, 'What is your Email ID?', 'आपकी ईमेल आईडी क्या है?'));
      break;
      
    case 1.2:
      await createOrUpdateLead(phone, { email: text, currentStep: "2" });
      await sendWhatsAppMessage(phone, t(lang, 'Question 2: Where are you located? Please select your State:', 'प्रश्न 2: आप कहाँ स्थित हैं? अपना राज्य चुनें:'), undefined, ["Bihar", "Uttar Pradesh", "Delhi", "Maharashtra", "Other"]);
      break;

    case 2:
      await createOrUpdateLead(phone, { state: text, currentStep: "2.1" });
      await sendWhatsAppMessage(phone, t(lang, 'Please select your District:', 'अपना जिला चुनें:'), undefined, ["Patna", "Gaya", "Muzaffarpur", "Other"]);
      break;

    case 2.1:
      await createOrUpdateLead(phone, { district: text, currentStep: "2.2" });
      await sendWhatsAppMessage(phone, t(lang, 'Please select your City/Town:', 'अपना शहर/कस्बा चुनें:'), undefined, ["Patna City", "Danapur", "Other"]);
      break;

    case 2.2:
      await createOrUpdateLead(phone, { city: text, currentStep: "2.3" });
      await sendWhatsAppMessage(phone, t(lang, 'What is your Pin Code?', 'आपका पिन कोड क्या है?'));
      break;

    case 2.3:
      await createOrUpdateLead(phone, { pincode: text, currentStep: "2.4" });
      await sendWhatsAppMessage(phone, t(lang, 'Please tap the + icon and share your GPS Location:', 'कृपया + आइकन पर टैप करें और अपना GPS स्थान साझा करें:'));
      break;

    case 2.4:
      await createOrUpdateLead(phone, { gpsLocation: text, currentStep: "3" });
      await sendWhatsAppMessage(phone, t(lang, 'Question 3: Select State Electricity Board:', 'प्रश्न 3: राज्य विद्युत बोर्ड चुनें:'), undefined, ["NBPDCL", "SBPDCL", "UPPCL", "Other"]);
      break;

    case 3:
      await createOrUpdateLead(phone, { electricityBoard: text, currentStep: "3.1" });
      await sendWhatsAppMessage(phone, t(lang, 'Question 3(a): What is your Consumer Number?', 'प्रश्न 3(a): आपका उपभोक्ता नंबर क्या है?'));
      break;

    case 3.1:
      await createOrUpdateLead(phone, { consumerNumber: text, currentStep: "4" });
      await sendWhatsAppMessage(phone, t(lang, 'Question 4: What is your Meter Type?', 'प्रश्न 4: आपका मीटर प्रकार क्या है?'), undefined, ["Residential", "Commercial", "Industrial"]);
      break;

    case 4:
      await createOrUpdateLead(phone, { meterType: text, currentStep: "6" });
      await sendWhatsAppMessage(phone, t(lang, 'Question 6: What is the Available Roof Space on your Roof (in sq ft)?', 'प्रश्न 6: आपकी छत पर कितनी जगह उपलब्ध है (वर्ग फुट में)?'));
      break;

    case 6:
      await createOrUpdateLead(phone, { roofSpace: text, currentStep: "7" });
      await sendWhatsAppMessage(phone, t(lang, 'Question 7: What is your Business Type?', 'प्रश्न 7: आपके व्यवसाय का प्रकार क्या है?'), undefined, ["Aata/Oil Mill", "Bike Showroom", "Tractor Agency", "Packaging", "Rice Mill", "Fabrication", "Other"]);
      break;

    case 7:
      await createOrUpdateLead(phone, { businessType: text, currentStep: "7.1" });
      await sendWhatsAppMessage(phone, t(lang, 'Question 7(a): What is your Monthly Billing Amount?', 'प्रश्न 7(a): आपकी मासिक बिलिंग राशि क्या है?'), undefined, ["Less than 1000", "2000 - 4000", "4000 - 10000", "15000 - 30000", "50000+", "100000+"]);
      break;

    case 7.1:
      await createOrUpdateLead(phone, { monthlyBilling: text, currentStep: "7.2" });
      await sendWhatsAppMessage(phone, t(lang, 'Question 7(b): What Capacity Plant do you want to Install?', 'प्रश्न 7(b): आप कितनी क्षमता का प्लांट लगाना चाहते हैं?'), undefined, ["5 kW", "10 kW", "50 kW", "100 kW", "500 kW", "1000 kW"]);
      break;

    case 7.2:
      await createOrUpdateLead(phone, { plantCapacity: text, currentStep: "8" });
      // Simulate sending PDF Link via simple text
      await sendWhatsAppMessage(phone, t(lang, 'Here is the proposal PDF based on your load selection: https://divyanshisolar.com/solar-proposal.pdf', 'यहाँ आपके लोड चयन के आधार पर प्रस्ताव PDF है: https://divyanshisolar.com/solar-proposal.pdf'));
      setTimeout(async () => {
        await sendWhatsAppMessage(phone, t(lang, 'Are you interested in proceeding?', 'क्या आप आगे बढ़ने में रुचि रखते हैं?'), [t(lang, 'Interested', 'रुचि है'), t(lang, 'Not Interested', 'रुचि नहीं है'), t(lang, 'Call Later', 'बाद में कॉल करेंगे')]);
      }, 1000);
      break;

    case 8:
      await createOrUpdateLead(phone, { proposalStatus: text, currentStep: "9" });
      if (text.includes('Interest') || text.includes('रुचि')) {
        await sendWhatsAppMessage(phone, t(lang, 'Great! How would you like to proceed?', 'बहुत बढ़िया! आप कैसे आगे बढ़ना चाहेंगे?'), [t(lang, 'Online Form', 'ऑनलाइन फॉर्म'), t(lang, 'Call Me', 'कॉल पर समझें'), t(lang, 'Home Visit', 'होम विजिट')]);
      } else {
        await createOrUpdateLead(phone, { currentStep: "10", status: 'Closed' });
        await sendWhatsAppMessage(phone, t(lang, 'Thank you for your time. Have a great day!', 'आपके समय के लिए धन्यवाद. आपका दिन शुभ हो!'));
      }
      break;

    case 9:
      await createOrUpdateLead(phone, { status: text, currentStep: "10" });
      await sendWhatsAppMessage(phone, t(lang, 'Thank you for choosing Divyanshi Solar! Our team will reach out to you shortly. ☀️', 'दिव्यांशी सोलर को चुनने के लिए धन्यवाद! हमारी टीम जल्द ही आपसे संपर्क करेगी। ☀️'));
      break;
      
    default:
        // Reset or Handle already closed tickets
        await sendWhatsAppMessage(phone, t(lang, 'You have completed the form. Our team will contact you soon.', 'आपने फॉर्म पूरा कर लिया है। हमारी टीम जल्द ही आपसे संपर्क करेगी।'));
        break;
  }
};
