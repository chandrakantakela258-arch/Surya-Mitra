import React, { useState, useEffect, useRef } from 'react';
import { Send, MapPin, Building2, Download, X, Sun, Sparkles } from 'lucide-react';
import '../pages/simulator.css';

interface Msg {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  buttons?: string[];
  options?: string[]; // Dropdown
  isLocation?: boolean;
}

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
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

  // Initialize bot slightly after opening to make it feel natural
  useEffect(() => {
    if (isOpen && messages.length === 0 && step === 0) {
      setTimeout(() => {
        addBotMessage('Hi! I am the PM Surya Ghar bot. Please select your language / कृपया भाषा चुनें:', ['English', 'हिन्दी']);
      }, 500);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return; // Don't process steps if closed
    
    // Skip step 0 because it's handled by the initialization above
    if (step === 1) {
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
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end">
      {/* Popover Content */}
      {isOpen && (
        <div className="bg-[#e5ddd5] rounded-2xl shadow-2xl border border-gray-100 mb-4 w-[350px] overflow-hidden transform transition-all duration-300 ease-out origin-bottom-right">
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-3 text-white relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sun size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">PM Surya Ghar Solar Bot</h3>
                <p className="text-green-50 text-xs">Online • Replies instantly</p>
              </div>
            </div>
          </div>
          
          <div className="h-[400px] overflow-y-auto p-4 flex flex-col gap-3 relative bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]">
            {messages.map((m) => (
              <div key={m.id} className={`flex w-full ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 shadow-sm relative text-sm text-gray-800 ${
                  m.sender === 'user' 
                  ? 'bg-[#d9fdd3] rounded-tr-none' 
                  : 'bg-white rounded-tl-none'
                }`}>
                  {/* Tail pseudo-elements are handled via the CSS framework/styles but we visually emulate them */}
                  {m.text}
                  
                  {m.buttons && (
                    <div className="mt-3 flex flex-col gap-2">
                      {m.buttons.map(b => (
                        <button key={b} className="text-blue-500 font-semibold border border-blue-100 bg-blue-50 hover:bg-blue-100 py-1.5 px-3 rounded-md transition-colors text-sm text-center" onClick={() => handleNextStep(b)}>{b}</button>
                      ))}
                    </div>
                  )}

                  {m.options && (
                    <div className="mt-3">
                      <select className="w-full border border-gray-200 bg-gray-50 text-gray-700 rounded-md p-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" onChange={(e) => {
                        if(e.target.value) handleNextStep(e.target.value);
                      }} defaultValue="">
                        <option value="" disabled>Select an option...</option>
                        {m.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  )}

                  {m.isLocation && (
                    <button className="mt-3 w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 font-semibold py-2 px-3 rounded-md border border-green-200 hover:bg-green-100 transition-colors" onClick={() => handleNextStep("📍 GPS Location Shared")}>
                      <MapPin size={16} /> {t('Share Live Location', 'लाइव स्थान साझा करें')}
                    </button>
                  )}
                  
                  {/* Empty timestamp space so text doesn't overlap */}
                  <span className="inline-block w-8"></span>
                  <span className="text-[10px] text-gray-400 absolute bottom-1 right-2 w-8 text-right">
                    {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-3 bg-[#f0f2f5]">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="flex-1 rounded-full border-none px-4 py-2.5 outline-none focus:ring-2 focus:ring-green-500 text-sm shadow-sm"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
              />
              <button 
                type="submit" 
                className="w-10 h-10 bg-[#00a884] text-white rounded-full flex items-center justify-center shadow-sm hover:bg-green-600 transition-colors"
              >
                <Send size={18} className="translate-x-[-1px] translate-y-[1px]" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-[#25D366] text-white rounded-full shadow-lg shadow-green-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all relative group"
        aria-label="Chat with Bot"
      >
        {!isOpen && (
          <div className="absolute inset-0 rounded-full border-2 border-green-500/50 animate-ping opacity-75" style={{ animationDuration: '2s' }}></div>
        )}
        
        {isOpen ? (
          <X size={28} className="transform transition-transform rotate-90 scale-110 group-hover:rotate-180" />
        ) : (
          <div className="relative">
            <Sun size={34} className="transform transition-transform group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:rotate-90 duration-500" />
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
