import React, { useState, useEffect, useRef } from 'react';
import { Send, MapPin, X, Sun, Sparkles, Copy, Check, Share2 } from 'lucide-react';
import '../pages/simulator.css';

interface Msg {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  buttons?: string[];
  options?: string[];
  isLocation?: boolean;
}

// Generate a unique session ID for this browser session
const SESSION_ID = Math.random().toString(36).substring(2, 15);

const saveLead = async (data: Record<string, string>) => {
  try {
    await fetch('/api/public/web-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: SESSION_ID, ...data }),
    });
  } catch (e) {
    // Silently fail — don't interrupt chat experience
  }
};

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [botNumber, setBotNumber] = useState('919801005212');

  const chatEndRef = useRef<HTMLDivElement>(null);

  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

  const addBotMessage = (text: string, buttons?: string[], options?: string[], isLocation?: boolean) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text, buttons, options, isLocation }]);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
  };

  // Load bot phone number from Admin settings
  useEffect(() => {
    fetch('/api/public/whatsapp-config')
      .then(r => r.json())
      .then(d => { if (d.botNumber) setBotNumber(d.botNumber); })
      .catch(() => {});
  }, []);

  const shareLink = `https://wa.me/${botNumber}?text=Hi`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // State Machine logic with CRM saving
  const handleNextStep = (userReply: string) => {
    addUserMessage(userReply);
    setTimeout(() => {
      switch (step) {
        case 0:
          const newLang = userReply === 'हिन्दी' ? 'hi' : 'en';
          setLang(newLang);
          saveLead({ language: newLang });
          setStep(1);
          break;
        case 1:
          saveLead({ name: userReply });
          setStep(1.1);
          break;
        case 1.1:
          saveLead({ phone: `web_${SESSION_ID}` }); // mobile number stored as note
          setStep(1.2);
          break;
        case 1.2:
          saveLead({ email: userReply });
          setStep(2);
          break;
        case 2:
          saveLead({ state: userReply });
          setStep(2.1);
          break;
        case 2.1:
          saveLead({ district: userReply });
          setStep(2.2);
          break;
        case 2.2:
          saveLead({ city: userReply });
          setStep(2.3);
          break;
        case 2.3:
          saveLead({ pincode: userReply });
          setStep(2.4);
          break;
        case 2.4:
          saveLead({ gpsLocation: userReply });
          setStep(3);
          break;
        case 3:
          saveLead({ electricityBoard: userReply });
          setStep(3.1);
          break;
        case 3.1:
          saveLead({ consumerNumber: userReply });
          setStep(4);
          break;
        case 4:
          saveLead({ meterType: userReply });
          setStep(6);
          break;
        case 6:
          saveLead({ roofSpace: userReply });
          setStep(7);
          break;
        case 7:
          saveLead({ businessType: userReply });
          setStep(7.1);
          break;
        case 7.1:
          saveLead({ monthlyBilling: userReply });
          setStep(7.2);
          break;
        case 7.2:
          saveLead({ plantCapacity: userReply });
          setStep(8);
          break;
        case 8:
          saveLead({ proposalStatus: userReply });
          if (userReply === t('Interested', 'रुचि है') || userReply === 'Interested') {
            setStep(9);
          } else {
            saveLead({ status: 'Closed' });
            setStep(10);
          }
          break;
        case 9:
          saveLead({ status: userReply });
          setStep(10);
          break;
      }
    }, 600);
  };

  // Initialize bot on open
  useEffect(() => {
    if (isOpen && messages.length === 0 && step === 0) {
      setTimeout(() => {
        addBotMessage('Hi! I am the PM Surya Ghar Solar Bot ☀️\nPlease select your language / कृपया भाषा चुनें:', ['English', 'हिन्दी']);
      }, 500);
    }
  }, [isOpen]);

  // Step-driven bot messages
  useEffect(() => {
    if (!isOpen) return;
    if (step === 1) {
      addBotMessage(t('Question 1: What is your Name?', 'प्रश्न 1: आपका नाम क्या है?'));
    } else if (step === 1.1) {
      addBotMessage(t('Please enter your 10-digit Mobile Number:', 'कृपया अपना 10-अंकीय मोबाइल नंबर दर्ज करें:'));
    } else if (step === 1.2) {
      addBotMessage(t('What is your Email ID?', 'आपकी ईमेल आईडी क्या है?'));
    } else if (step === 2) {
      addBotMessage(t('Q2: Please select your State:', 'प्रश्न 2: अपना राज्य चुनें:'), undefined, ["Bihar", "Uttar Pradesh", "Delhi", "Maharashtra", "Other"]);
    } else if (step === 2.1) {
      addBotMessage(t('Please select your District:', 'अपना जिला चुनें:'), undefined, ["Patna", "Gaya", "Muzaffarpur", "Other"]);
    } else if (step === 2.2) {
      addBotMessage(t('Please select your City/Town:', 'अपना शहर/कस्बा चुनें:'), undefined, ["Patna City", "Danapur", "Other"]);
    } else if (step === 2.3) {
      addBotMessage(t('What is your Pin Code?', 'आपका पिन कोड क्या है?'));
    } else if (step === 2.4) {
      addBotMessage(t('Please share your GPS Location:', 'अपनी GPS लोकेशन साझा करें:'), [], [], true);
    } else if (step === 3) {
      addBotMessage(t('Q3: Select State Electricity Board:', 'प्रश्न 3: राज्य विद्युत बोर्ड चुनें:'), undefined, ["NBPDCL", "SBPDCL", "UPPCL", "Other"]);
    } else if (step === 3.1) {
      addBotMessage(t('Q3(a): What is your Consumer Number?', 'प्रश्न 3(a): आपका उपभोक्ता नंबर क्या है?'));
    } else if (step === 4) {
      addBotMessage(t('Q4: What is your Meter Type?', 'प्रश्न 4: आपका मीटर प्रकार क्या है?'), undefined, ["Residential", "Commercial", "Industrial"]);
    } else if (step === 6) {
      addBotMessage(t('Q6: Available Roof Space (in sq ft)?', 'प्रश्न 6: छत पर उपलब्ध जगह (वर्ग फुट में)?'));
    } else if (step === 7) {
      addBotMessage(t('Q7: What is your Business Type?', 'प्रश्न 7: आपके व्यवसाय का प्रकार?'), undefined, [
        "Aata/Oil/Masala Mill", "Bike/Car Showroom", "Tractor Agency", "RO/Packaging Plant", "Rice Mill", "Fabrication Plant", "Other Industrial Unit"
      ]);
    } else if (step === 7.1) {
      addBotMessage(t('Q7(a): Monthly Electricity Bill?', 'प्रश्न 7(a): मासिक बिजली बिल राशि?'), undefined, [
        "Less than 1000", "2000 - 4000", "4000 - 10000", "15000 - 30000", "More than 50000", "More than 100000"
      ]);
    } else if (step === 7.2) {
      addBotMessage(t('Q7(b): Plant Capacity to Install?', 'प्रश्न 7(b): कितनी क्षमता का प्लांट लगाना चाहते हैं?'), undefined, [
        "5 kW", "10 kW", "50 kW", "100 kW", "500 kW", "1000 kW"
      ]);
    } else if (step === 8) {
      addBotMessage(t('📄 Based on your inputs, here is your estimated Solar Proposal: Solar_Proposal.pdf', '📄 आपके इनपुट के आधार पर यहाँ आपका अनुमानित सोलर प्रस्ताव है: Solar_Proposal.pdf'));
      setTimeout(() => {
        addBotMessage(t('Are you interested in proceeding?', 'क्या आप आगे बढ़ने में रुचि रखते हैं?'), [
          t('Interested', 'रुचि है'),
          t('Not Interested', 'रुचि नहीं है'),
          t('Will Call Later', 'बाद में कॉल करेंगे'),
          t('Install after 2-3 months', '2-3 महीने बाद लगायेंगे')
        ]);
      }, 800);
    } else if (step === 9) {
      addBotMessage(t('Great! How would you like to proceed?', 'बहुत बढ़िया! आप कैसे आगे बढ़ना चाहेंगे?'), [
        t('Fill Online Form', 'ऑनलाइन फॉर्म भरें'),
        t('Call for Understanding', 'कॉल पर समझें'),
        t('Schedule Home Visit', 'होम विजिट शेड्यूल करें')
      ]);
    } else if (step === 10) {
      addBotMessage(t('Thank you for choosing Divyanshi Solar! Our team will contact you soon. ☀️', 'दिव्यांशी सोलर को चुनने के लिए धन्यवाद! हमारी टीम जल्द ही संपर्क करेगी। ☀️'));
    }
  }, [step]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleNextStep(inputText);
    setInputText('');
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-[#e5ddd5] rounded-2xl shadow-2xl border border-gray-100 mb-4 w-[350px] overflow-hidden transform transition-all duration-300 ease-out origin-bottom-right">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-3 text-white relative">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-3 right-3 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Sun size={22} className="text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base leading-tight">PM Surya Ghar Solar Bot</h3>
                <p className="text-green-50 text-xs">Online • Replies instantly</p>
              </div>
            </div>
            {/* Shareable Link */}
            <div className="mt-3 flex gap-2">
              <a
                href={shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs py-1.5 px-3 rounded-full text-center transition-colors flex items-center justify-center gap-1"
              >
                <Share2 size={12} /> Chat on WhatsApp
              </a>
              <button
                onClick={handleCopyLink}
                className="bg-white/20 hover:bg-white/30 text-white text-xs py-1.5 px-3 rounded-full transition-colors flex items-center gap-1"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Share Link'}
              </button>
            </div>
          </div>

          {/* Chat Body */}
          <div className="h-[380px] overflow-y-auto p-3 flex flex-col gap-2.5">
            {messages.map((m) => (
              <div key={m.id} className={`flex w-full ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-2.5 shadow-sm relative text-sm text-gray-800 ${
                  m.sender === 'user'
                  ? 'bg-[#d9fdd3] rounded-tr-none'
                  : 'bg-white rounded-tl-none'
                }`}>
                  {m.text}

                  {m.buttons && (
                    <div className="mt-2.5 flex flex-col gap-1.5">
                      {m.buttons.map(b => (
                        <button key={b} className="text-blue-500 font-semibold border border-blue-100 bg-blue-50 hover:bg-blue-100 py-1.5 px-3 rounded-md transition-colors text-xs text-center" onClick={() => handleNextStep(b)}>{b}</button>
                      ))}
                    </div>
                  )}

                  {m.options && (
                    <div className="mt-2.5">
                      <select className="w-full border border-gray-200 bg-gray-50 text-gray-700 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-green-500 outline-none" onChange={(e) => {
                        if (e.target.value) handleNextStep(e.target.value);
                      }} defaultValue="">
                        <option value="" disabled>Select an option...</option>
                        {m.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  )}

                  {m.isLocation && (
                    <button className="mt-2.5 w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 font-semibold py-1.5 px-3 rounded-md border border-green-200 hover:bg-green-100 transition-colors text-xs" onClick={() => handleNextStep("📍 GPS Location Shared")}>
                      <MapPin size={14} /> {t('Share Live Location', 'लाइव स्थान साझा करें')}
                    </button>
                  )}

                  <span className="inline-block w-8"></span>
                  <span className="text-[10px] text-gray-400 absolute bottom-1 right-2">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[#f0f2f5]">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 rounded-full border-none px-4 py-2 outline-none focus:ring-2 focus:ring-green-500 text-sm shadow-sm"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
              />
              <button
                type="submit"
                className="w-9 h-9 bg-[#00a884] text-white rounded-full flex items-center justify-center shadow-sm hover:bg-green-600 transition-colors flex-shrink-0"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-[#25D366] text-white rounded-full shadow-lg shadow-green-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all relative group"
        aria-label="Chat with Solar Bot"
      >
        {!isOpen && (
          <div className="absolute inset-0 rounded-full border-2 border-green-500/50 animate-ping opacity-75" style={{ animationDuration: '2s' }}></div>
        )}
        {isOpen ? (
          <X size={28} className="transform transition-transform rotate-90 scale-110 group-hover:rotate-180" />
        ) : (
          <div className="relative">
            <Sun size={34} className="transform transition-transform group-hover:rotate-90 duration-500" />
            <Sparkles size={14} className="absolute -top-1 -right-2 text-yellow-300 animate-pulse" />
          </div>
        )}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </button>
    </div>
  );
}
