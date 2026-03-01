import axios from 'axios';
import { db } from './db';
import { storage } from './storage';
import { whatsappLeads } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Translations
const t = (lang: string, en: string, hi: string) => lang === 'hi' ? hi : en;

// Capacity options by type
const RESIDENTIAL_PLANTS = ["3kW On-Grid", "3kW 3-in-1 Hybrid", "5kW 3-in-1 Hybrid", "6kW On-Grid", "6kW 3-in-1 Hybrid", "6.5kW On-Grid"];
const BIKE_SHOWROOM_PLANTS = ["3kW On-Grid", "3kW 3-in-1 Hybrid"];
const GENERAL_CAPACITIES = ["2 kW", "3 kW", "6 kW", "15 kW", "25 kW", "50 kW", "100 kW", "500 kW", "1000 kW"];

// Send WhatsApp text or interactive message
const sendWhatsAppMessage = async (to: string, text: string, buttons: string[] | null = null, options: string[] | null = null) => {
  let messageData: any = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
  };

  if (buttons) {
    // Meta limits buttons to 3 max, so truncate silently
    const safeButtons = buttons.slice(0, 3);
    messageData.type = "interactive";
    messageData.interactive = {
      type: "button",
      body: { text: text },
      action: {
        buttons: safeButtons.map((btn, index) => ({
          type: "reply",
          reply: { id: `btn_${index}`, title: btn.substring(0, 20) }
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
              title: opt.substring(0, 24),
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
    await db.insert(whatsappLeads).values({ ...data, phone });
  } else {
    data.updatedAt = new Date();
    await db.update(whatsappLeads).set(data).where(eq(whatsappLeads.phone, phone));
  }
};

export const processMessage = async (phone: string, text: string) => {
  let lead = await getLead(phone);

  if (!lead) {
    await createOrUpdateLead(phone, { currentStep: "0" });
    await sendWhatsAppMessage(phone, 'Please select your preferred language / कृपया अपनी पसंदीदा भाषा चुनें:', ['English', 'हिन्दी']);
    return;
  }

  let step = parseFloat(lead.currentStep || "0");
  let lang = lead.language || "en";

  switch (step) {
    case 0:
      lang = text === 'हिन्दी' ? 'hi' : 'en';
      await createOrUpdateLead(phone, { language: lang, currentStep: "1" });
      await sendWhatsAppMessage(phone, t(lang, 'What is your Name?', 'आपका नाम क्या है?'));
      break;

    case 2:
      await createOrUpdateLead(phone, { name: text, currentStep: "2" });
      await sendWhatsAppMessage(phone, t(lang, 'Please enter your 10-digit Mobile Number:', 'कृपया अपना 10-अंकीय मोबाइल नंबर दर्ज करें:'));
      break;

    case 3:
      await createOrUpdateLead(phone, { currentStep: "3" });
      await sendWhatsAppMessage(phone, t(lang, 'What is your Email ID?', 'आपकी ईमेल आईडी क्या है?'));
      break;

    case 4:
      await createOrUpdateLead(phone, { email: text, currentStep: "4" });
      await sendWhatsAppMessage(phone, t(lang, 'Q2: Please type your State name:', 'प्रश्न 2: अपना राज्य टाइप करें:'));
      break;

    case 4.1:
      await createOrUpdateLead(phone, { state: text, currentStep: "4.1" });
      await sendWhatsAppMessage(phone, t(lang, 'Please type your District name:', 'अपना जिला टाइप करें:'));
      break;

    case 4.2:
      await createOrUpdateLead(phone, { district: text, currentStep: "4.3" });
      await sendWhatsAppMessage(phone, t(lang, 'Please type your City/Town name:', 'अपना शहर/कस्बा टाइप करें:'));
      break;

    case 5:
      await createOrUpdateLead(phone, { city: text, currentStep: "5" });
      await sendWhatsAppMessage(phone, t(lang, 'What is your Pin Code?', 'आपका पिन कोड क्या है?'));
      break;

    case 6:
      await createOrUpdateLead(phone, { pincode: text, currentStep: "6" });
      await sendWhatsAppMessage(phone, t(lang, 'Please tap the + icon and share your GPS Location:', 'कृपया + आइकन पर टैप करें और अपना GPS स्थान साझा करें:'));
      break;

    case 7:
      await createOrUpdateLead(phone, { gpsLocation: text, currentStep: "7" });
      await sendWhatsAppMessage(phone, t(lang, 'Select State Electricity Board:', 'राज्य विद्युत बोर्ड चुनें:'), null, ["NBPDCL", "SBPDCL", "UPPCL", "DHBVN", "UHBVN", "JVVNL", "Other"]);
      break;

    case 8:
      await createOrUpdateLead(phone, { electricityBoard: text, currentStep: "8" });
      await sendWhatsAppMessage(phone, t(lang, 'What is your Consumer Number?', 'आपका उपभोक्ता नंबर क्या है?'));
      break;

    case 11:
      await createOrUpdateLead(phone, { consumerNumber: text, currentStep: "11" });
      await sendWhatsAppMessage(phone, t(lang, 'What is your Connection Type?', 'आपका कनेक्शन प्रकार क्या है?'), null, ["Residential", "Commercial", "Industrial"]);
      break;

    case 4:
      await createOrUpdateLead(phone, { meterType: text, currentStep: text === 'Residential' ? "4.5" : "6" });
      if (text === 'Residential') {
        await sendWhatsAppMessage(phone,
          t(lang, 'Great! For Residential, here are the recommended solar plants. Please select:', 'बढ़िया! घरेलू कनेक्शन के लिए अनुशंसित सोलर प्लांट चुनें:'),
          null, RESIDENTIAL_PLANTS
        );
      } else {
        await sendWhatsAppMessage(phone, t(lang, 'Available Roof Space (in sq ft)?', 'छत पर उपलब्ध जगह (वर्ग फुट में)?'));
      }
      break;

    case 11.1: // Residential plant chosen → go to proposal
      await createOrUpdateLead(phone, { plantCapacity: text, currentStep: "8" });
      await sendWhatsAppMessage(phone, t(lang, '📄 Here is your Solar Proposal: https://divyanshisolar.com/solar-proposal.pdf\n\nOur team will prepare a detailed customized proposal for you shortly.', '📄 यहाँ आपका सोलर प्रस्ताव है: https://divyanshisolar.com/solar-proposal.pdf'));
      setTimeout(async () => {
        await sendWhatsAppMessage(phone, t(lang, 'Are you interested in proceeding?', 'क्या आप आगे बढ़ने में रुचि रखते हैं?'), [t(lang, 'Interested', 'रुचि है'), t(lang, 'Not Interested', 'रुचि नहीं है'), t(lang, 'Call Later', 'बाद में कॉल करेंगे')]);
      }, 1000);
      break;

    case 6:
      await createOrUpdateLead(phone, { roofSpace: text, currentStep: "7" });
      await sendWhatsAppMessage(phone, t(lang, 'What is your Business Type?', 'आपके व्यवसाय का प्रकार?'), null, [
        "Bike/Car Showroom", "Aata/Oil/Masala Mill", "Tractor Agency", "RO/Packaging Plant", "Rice Mill", "Fabrication Plant", "Other Industrial Unit"
      ]);
      break;

    case 7:
      await createOrUpdateLead(phone, { businessType: text });
      const isBikeShowroom = text.toLowerCase().includes('bike') || text.toLowerCase().includes('showroom');
      await createOrUpdateLead(phone, { currentStep: isBikeShowroom ? "7.5" : "7.1" });
      if (isBikeShowroom) {
        await sendWhatsAppMessage(phone,
          t(lang, 'For Bike/Car Showroom, here are the best suited solar plants. Please select:', 'बाइक/कार शोरूम के लिए अनुशंसित सोलर प्लांट चुनें:'),
          null, BIKE_SHOWROOM_PLANTS
        );
      } else {
        await sendWhatsAppMessage(phone, t(lang, 'Monthly Electricity Bill Amount?', 'मासिक बिजली बिल राशि?'), null, [
          "Less than 1000", "2000-4000", "4000-10000", "15000-30000", "50000+", "100000+"
        ]);
      }
      break;

    case 7.5: // Bike Showroom plant → proposal
      await createOrUpdateLead(phone, { plantCapacity: text, currentStep: "8" });
      await sendWhatsAppMessage(phone, t(lang, '📄 Here is your Solar Proposal: https://divyanshisolar.com/solar-proposal.pdf', '📄 यहाँ आपका सोलर प्रस्ताव: https://divyanshisolar.com/solar-proposal.pdf'));
      setTimeout(async () => {
        await sendWhatsAppMessage(phone, t(lang, 'Are you interested in proceeding?', 'क्या आप आगे बढ़ने में रुचि रखते हैं?'), [t(lang, 'Interested', 'रुचि है'), t(lang, 'Not Interested', 'रुचि नहीं है'), t(lang, 'Call Later', 'बाद में')]);
      }, 1000);
      break;

    case 7.1:
      await createOrUpdateLead(phone, { monthlyBilling: text, currentStep: "7.2" });
      await sendWhatsAppMessage(phone, t(lang, 'What Capacity Plant do you want to Install?', 'कितनी क्षमता का प्लांट लगाना चाहते हैं?'), null, GENERAL_CAPACITIES);
      break;

    case 7.2:
      await createOrUpdateLead(phone, { plantCapacity: text, currentStep: "8" });
      await sendWhatsAppMessage(phone, t(lang, '📄 Solar Proposal: https://divyanshisolar.com/solar-proposal.pdf', '📄 सोलर प्रस्ताव: https://divyanshisolar.com/solar-proposal.pdf'));
      setTimeout(async () => {
        await sendWhatsAppMessage(phone, t(lang, 'Are you interested in proceeding?', 'क्या आप आगे बढ़ने में रुचि रखते हैं?'), [t(lang, 'Interested', 'रुचि है'), t(lang, 'Not Interested', 'रुचि नहीं है'), t(lang, 'Call Later', 'बाद में')]);
      }, 1000);
      break;

    case 8:
      await createOrUpdateLead(phone, { proposalStatus: text, currentStep: "9" });
      if (text.toLowerCase().includes('interest') || text.includes('रुचि')) {
        await sendWhatsAppMessage(phone, t(lang, 'Great! How would you like to proceed?', 'बहुत बढ़िया! आप कैसे आगे बढ़ना चाहेंगे?'), [t(lang, 'Online Form', 'ऑनलाइन फॉर्म'), t(lang, 'Call Me', 'कॉल करें'), t(lang, 'Home Visit', 'होम विजिट')]);
      } else {
        await createOrUpdateLead(phone, { currentStep: "10", status: 'Closed' });
        await sendWhatsAppMessage(phone, t(lang, 'Thank you for your time. Have a great day!', 'आपके समय के लिए धन्यवाद! आपका दिन शुभ हो।'));
      }
      break;

    case 9:
      await createOrUpdateLead(phone, { status: text, currentStep: "10" });
      await sendWhatsAppMessage(phone, t(lang, 'Thank you for choosing Divyanshi Solar! Our team will reach out to you shortly. ☀️', 'दिव्यांशी सोलर को चुनने के लिए धन्यवाद! हमारी टीम जल्द ही संपर्क करेगी। ☀️'));
      break;

    default:
      await sendWhatsAppMessage(phone, t(lang, 'You have already completed the form. Our team will contact you soon.', 'आपने फॉर्म पहले ही पूरा कर लिया है। हमारी टीम जल्द ही संपर्क करेगी।'));
      break;
  }
};
