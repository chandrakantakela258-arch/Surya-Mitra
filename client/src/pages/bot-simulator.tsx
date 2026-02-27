import React, { useState, useEffect, useRef } from 'react';
import { Send, MapPin, Building2, Download } from 'lucide-react';
import './simulator.css';

interface Msg {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  buttons?: string[];
  options?: string[]; // Dropdown
  isLocation?: boolean;
}

export default function BotSimulator() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [inputText, setInputText] = useState('');
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

  const addBotMessage = (text: string, buttons?: string[], options?: string[], isLocation?: boolean) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text, buttons, options, isLocation }]);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
  };

  // State Machine logic
  const handleNextStep = (userReply: string) => {
    addUserMessage(userReply);
    
    setTimeout(() => {
      switch (step) {
        case 0:
          setLang(userReply === 'हिन्दी' ? 'hi' : 'en');
          setStep(1);
          break;
        case 1:
          setStep(1.1);
          break;
        case 1.1:
          setStep(1.2);
          break;
        case 1.2:
          setStep(2);
          break;
        case 2:
          setStep(2.1);
          break;
        case 2.1:
          setStep(2.2);
          break;
        case 2.2:
          setStep(2.3);
          break;
        case 2.3:
          setStep(2.4);
          break;
        case 2.4:
          setStep(3);
          break;
        case 3:
          setStep(3.1);
          break;
        case 3.1:
          setStep(4);
          break;
        case 4:
          setStep(6);
          break;
        case 6:
          setStep(7);
          break;
        case 7:
          setStep(7.1);
          break;
        case 7.1:
          setStep(7.2);
          break;
        case 7.2:
          setStep(8);
          break;
        case 8:
          if (userReply === t('Interested', 'रुचि है') || userReply === 'Interested') {
             setStep(9);
          } else {
             setStep(10);
          }
          break;
        case 9:
          setStep(10);
          break;
      }
    }, 600);
  };

  useEffect(() => {
    if (messages.length === 0 && step === 0) {
      addBotMessage('Please select your preferred language / कृपया अपनी पसंदीदा भाषा चुनें:', ['English', 'हिन्दी']);
    } else if (step === 1) {
      addBotMessage(t('Question 1: What is your Name?', 'प्रश्न 1: आपका नाम क्या है?'));
    } else if (step === 1.1) {
      addBotMessage(t('Please enter your 10-digit Mobile Number:', 'कृपया अपना 10-अंकीय मोबाइल नंबर दर्ज करें:'));
    } else if (step === 1.2) {
      addBotMessage(t('What is your Email ID?', 'आपकी ईमेल आईडी क्या है?'));
    } else if (step === 2) {
      addBotMessage(t('Question 2: Where are you located? Please select your State:', 'प्रश्न 2: आप कहाँ स्थित हैं? अपना राज्य चुनें:'), undefined, ["Bihar", "Uttar Pradesh", "Delhi", "Maharashtra", "Other"]);
    } else if (step === 2.1) {
      addBotMessage(t('Please select your District:', 'अपना जिला चुनें:'), undefined, ["Patna", "Gaya", "Muzaffarpur", "Other"]);
    } else if (step === 2.2) {
      addBotMessage(t('Please select your City/Town:', 'अपना शहर/कस्बा चुनें:'), undefined, ["Patna City", "Danapur", "Other"]);
    } else if (step === 2.3) {
      addBotMessage(t('What is your Pin Code?', 'आपका पिन कोड क्या है?'));
    } else if (step === 2.4) {
      addBotMessage(t('Please share your GPS Location:', 'अपनी GPS लोकेशन साझा करें:'), [], [], true);
    } else if (step === 3) {
      addBotMessage(t('Question 3: Select State Electricity Board:', 'प्रश्न 3: राज्य विद्युत बोर्ड चुनें:'), undefined, ["NBPDCL", "SBPDCL", "UPPCL", "Other"]);
    } else if (step === 3.1) {
      addBotMessage(t('Question 3(a): What is your Consumer Number?', 'प्रश्न 3(a): आपका उपभोक्ता नंबर क्या है?'));
    } else if (step === 4) {
      addBotMessage(t('Question 4: What is your Meter Type?', 'प्रश्न 4: आपका मीटर प्रकार क्या है?'), undefined, ["Residential", "Commercial", "Industrial"]);
    } else if (step === 6) {
      addBotMessage(t('Question 6: What is the Available Roof Space on your Roof (in sq ft)?', 'प्रश्न 6: आपकी छत पर कितनी जगह उपलब्ध है (वर्ग फुट में)?'));
    } else if (step === 7) {
      addBotMessage(t('Question 7: What is your Business Type?', 'प्रश्न 7: आपके व्यवसाय का प्रकार क्या है?'), undefined, [
        "Aata/Oil/Masala Mill", "Bike/Car Showroom", "Tractor Agency", "RO/Packaging Plant", "Rice Mill", "Fabrication Plant", "Other Industrial Unit"
      ]);
    } else if (step === 7.1) {
      addBotMessage(t('Question 7(a): What is your Monthly Billing Amount?', 'प्रश्न 7(a): आपकी मासिक बिलिंग राशि क्या है?'), undefined, [
        "Less than 1000", "2000 - 4000", "4000 - 10000", "15000 - 30000", "More than 50000", "More than 100000"
      ]);
    } else if (step === 7.2) {
      addBotMessage(t('Question 7(b): What Capacity Plant do you want to Install?', 'प्रश्न 7(b): आप कितनी क्षमता का प्लांट लगाना चाहते हैं?'), undefined, [
        "5 kW", "10 kW", "50 kW", "100 kW", "500 kW", "1000 kW"
      ]);
    } else if (step === 8) {
      addBotMessage(t('Here is the proposal PDF based on your load selection: 📄 Solar_Proposal.pdf', 'यहाँ आपके लोड चयन के आधार पर प्रस्ताव PDF है: 📄 Solar_Proposal.pdf'));
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
      addBotMessage(t('Thank you for choosing Divyanshi Solar! Have a great day. ☀️', 'दिव्यांशी सोलर को चुनने के लिए धन्यवाद! आपका दिन शुभ हो। ☀️'));
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
    <div className="simulator-container container mx-auto px-4">
      <div className="phone-mockup">
        <div className="chat-header">
          <div className="avatar">
            <Building2 size={24} color="#fff" />
          </div>
          <div className="info">
            <h3>Divyanshi Solar Bot</h3>
            <span>Online</span>
          </div>
        </div>
        
        <div className="chat-body">
          {messages.map((m) => (
            <div key={m.id} className={`message ${m.sender}`}>
              <div className="bubble">
                {m.text}
                
                {m.buttons && (
                  <div className="btn-group">
                    {m.buttons.map(b => (
                      <button key={b} className="chat-btn" onClick={() => handleNextStep(b)}>{b}</button>
                    ))}
                  </div>
                )}

                {m.options && (
                  <div className="list-group">
                    <select className="chat-select" onChange={(e) => {
                      if(e.target.value) handleNextStep(e.target.value);
                    }} defaultValue="">
                      <option value="" disabled>Select an option...</option>
                      {m.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                )}

                {m.isLocation && (
                  <button className="chat-btn location-btn" onClick={() => handleNextStep("📍 GPS Location Shared")}>
                    <MapPin size={16} /> {t('Share Live Location', 'लाइव स्थान साझा करें')}
                  </button>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="chat-footer">
          <form onSubmit={handleSubmit} className="chat-form">
            <input 
              type="text" 
              placeholder="Type a message..." 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
            />
            <button type="submit" className="send-btn">
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
      
      <div className="sidebar-info">
        <h2>Solar Chatbot Flow Simulator</h2>
        <p>This interactive simulator demonstrates the exact customer journey requested. Since this is fully integrated into Surya-Mitra, data captured here will populate your live CRM Dashboard.</p>
        <ul className="feature-list">
          <li>🌍 Bilingual Support (EN & HI)</li>
          <li>📍 Location & Pincode tracking</li>
          <li>⚡ Customer Energy Profiling</li>
          <li>📄 Dynamic PDF Generation</li>
          <li>🔗 Shareable Customer `wa.me` Links</li>
          <li>📊 CRM & Admin Dashboard Ready</li>
        </ul>
      </div>
    </div>
  );
}
