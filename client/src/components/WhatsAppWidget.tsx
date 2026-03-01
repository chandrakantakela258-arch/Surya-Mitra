import React, { useState, useEffect, useRef } from 'react';
import { Send, MapPin, X, Sun, Copy, Check, Share2 } from 'lucide-react';

function SolarPanelIcon({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="12" width="36" height="22" rx="2" fill="#1565C0" stroke="white" strokeWidth="1.5" />
      <line x1="6" y1="23" x2="42" y2="23" stroke="white" strokeWidth="1" opacity="0.6" />
      <line x1="18" y1="12" x2="18" y2="34" stroke="white" strokeWidth="1" opacity="0.6" />
      <line x1="30" y1="12" x2="30" y2="34" stroke="white" strokeWidth="1" opacity="0.6" />
      <line x1="24" y1="34" x2="24" y2="42" stroke="white" strokeWidth="2" />
      <line x1="18" y1="42" x2="30" y2="42" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <circle cx="38" cy="8" r="5" fill="#FFD600" opacity="0.9" />
      <line x1="38" y1="1" x2="38" y2="3" stroke="#FFD600" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="44" y1="5" x2="42.5" y2="6.5" stroke="#FFD600" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="45" y1="8" x2="43" y2="8" stroke="#FFD600" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="33" y1="3" x2="34" y2="4.5" stroke="#FFD600" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
import { indianStatesData, getDistrictsForState, getCitiesForDistrict, getDiscomsForState } from "@shared/india-data";

interface Msg {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  buttons?: string[];
  options?: string[];
  isLocation?: boolean;
  mediaType?: string | null;
  mediaUrl?: string | null;
  mediaTitle?: string | null;
}

interface BranchRule {
  match: string;
  goToStep: string;
}

interface NodeConfig {
  stepId: string;
  messageEn: string;
  messageHi: string;
  inputType: string;
  options: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  mediaTitle: string | null;
  savesField: string | null;
  isActive: boolean;
  sortOrder: number;
  nextStepRules: BranchRule[] | null;
}

const SESSION_ID = Math.random().toString(36).substring(2, 15);

const saveLead = async (data: Record<string, string>) => {
  try {
    await fetch('/api/public/web-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: SESSION_ID, ...data }),
    });
  } catch (e) {}
};

const DYNAMIC_FIELDS = new Set(['state', 'district', 'city', 'electricityBoard']);

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [botNumber, setBotNumber] = useState('919211018779');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [nodeConfigs, setNodeConfigs] = useState<NodeConfig[]>([]);
  const [configsLoaded, setConfigsLoaded] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const t = (en: string, hi: string) => lang === 'hi' ? hi : en;

  useEffect(() => {
    fetch('/api/public/whatsapp-config')
      .then(r => r.json())
      .then(d => { if (d.botNumber) setBotNumber(d.botNumber); })
      .catch(() => {});
    fetch(`/api/public/chatbot-nodes?t=${Date.now()}`, { cache: "no-store" })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setNodeConfigs(d); setConfigsLoaded(true); })
      .catch(() => { setConfigsLoaded(true); });
  }, []);

  const sortedNodes = [...nodeConfigs].sort((a, b) => a.sortOrder - b.sortOrder);

  const getNode = (stepId: string): NodeConfig | undefined => {
    return nodeConfigs.find(n => n.stepId === stepId);
  };

  const getNextStepByRules = (currentStepId: string, userReply: string): string | null => {
    const node = getNode(currentStepId);
    if (!node?.nextStepRules || node.nextStepRules.length === 0) return null;
    for (const rule of node.nextStepRules) {
      if (rule.match && rule.goToStep) {
        if (userReply.toLowerCase().includes(rule.match.toLowerCase())) {
          return rule.goToStep;
        }
      }
    }
    return null;
  };

  const getDefaultNextStep = (stepId: string): string | null => {
    const currentNode = getNode(stepId);
    if (!currentNode) return null;
    const currentOrder = currentNode.sortOrder;
    const nextNode = sortedNodes.find(n => n.sortOrder > currentOrder);
    return nextNode ? nextNode.stepId : null;
  };

  const getDynamicOptions = (node: NodeConfig): string[] | null => {
    if (!node.savesField || !DYNAMIC_FIELDS.has(node.savesField)) return null;
    switch (node.savesField) {
      case 'state':
        return indianStatesData;
      case 'district': {
        const districts = getDistrictsForState(selectedState);
        return districts.length > 0 ? districts : ["Other"];
      }
      case 'city': {
        const cities = getCitiesForDistrict(selectedDistrict);
        return cities.length > 0 ? cities : ["Other"];
      }
      case 'electricityBoard': {
        return getDiscomsForState(selectedState);
      }
      default:
        return null;
    }
  };

  const whatsappLink = `https://wa.me/${botNumber}?text=Hi`;
  const shareLink = `${window.location.origin}/solar-bot`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addBotMessage = (text: string, buttons?: string[], options?: string[], isLocation?: boolean, mediaType?: string | null, mediaUrl?: string | null, mediaTitle?: string | null) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text, buttons, options, isLocation, mediaType, mediaUrl, mediaTitle }]);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'user', text }]);
  };

  const showNodeMessage = (node: NodeConfig) => {
    const msg = lang === 'hi' ? node.messageHi : node.messageEn;
    const dynamicOpts = getDynamicOptions(node);
    const nodeOpts = dynamicOpts || (node.options ? node.options.split(',').map(o => o.trim()) : undefined);
    const buttons = node.inputType === 'buttons' ? nodeOpts : undefined;
    const dropdown = node.inputType === 'dropdown' ? nodeOpts : undefined;
    const isLoc = node.inputType === 'location';
    addBotMessage(msg, buttons, dropdown, isLoc, node.mediaType, node.mediaUrl, node.mediaTitle);
  };

  const handleNextStep = (userReply: string) => {
    addUserMessage(userReply);
    setTimeout(() => {
      if (!currentStepId) return;
      const currentNode = getNode(currentStepId);

      if (currentNode?.savesField) {
        saveLead({ [currentNode.savesField]: userReply });
      }

      if (currentNode?.savesField === 'language') {
        const newLang = userReply === 'हिन्दी' ? 'hi' : 'en';
        setLang(newLang);
        saveLead({ language: newLang });
      }
      if (currentNode?.savesField === 'state') setSelectedState(userReply);
      if (currentNode?.savesField === 'district') setSelectedDistrict(userReply);

      const ruleNext = getNextStepByRules(currentStepId, userReply);
      if (ruleNext) {
        setCurrentStepId(ruleNext);
        return;
      }

      const nextStep = getDefaultNextStep(currentStepId);
      if (nextStep) {
        setCurrentStepId(nextStep);
      }
    }, 600);
  };

  const initDone = useRef(false);
  useEffect(() => {
    if (!isOpen || !configsLoaded) return;
    if (initDone.current) return;
    if (messages.length > 0) return;
    initDone.current = true;

    setTimeout(() => {
      const firstNode = sortedNodes[0];
      if (firstNode) {
        setCurrentStepId(firstNode.stepId);
        showNodeMessage(firstNode);
      } else {
        addBotMessage('Hi! I am the PM Surya Ghar Solar Bot ☀️\nPlease select your language / कृपया भाषा चुनें:', ['English', 'हिन्दी']);
        setCurrentStepId('0');
      }
    }, 500);
  }, [isOpen, configsLoaded]);

  useEffect(() => {
    if (!isOpen || !currentStepId) return;
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender !== 'user') return;

    const node = getNode(currentStepId);
    if (node) {
      showNodeMessage(node);
    }
  }, [currentStepId]);

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
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-[#e5ddd5] rounded-2xl shadow-2xl border border-gray-100 mb-4 w-[350px] overflow-hidden transform transition-all duration-300 ease-out origin-bottom-right">
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-3 text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sun size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm leading-tight">PM Surya Ghar Solar Bot</h3>
                  <p className="text-green-50 text-[10px]">Online • Replies instantly</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                className="flex-1 bg-white/20 hover:bg-white/30 text-white text-[11px] py-1.5 px-2 rounded-full text-center transition-colors flex items-center justify-center gap-1">
                <Share2 size={11} /> Chat on WhatsApp
              </a>
              <button onClick={handleCopyLink}
                className="bg-white/20 hover:bg-white/30 text-white text-[11px] py-1.5 px-3 rounded-full transition-colors flex items-center gap-1">
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? 'Copied!' : 'Share Link'}
              </button>
            </div>
          </div>

          <div className="h-[370px] overflow-y-auto p-3 flex flex-col gap-2.5 bg-[#e5ddd5]">
            {messages.map((m) => (
              <div key={m.id} className={`flex w-full ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-2.5 shadow-sm relative text-sm text-gray-800 ${
                  m.sender === 'user' ? 'bg-[#d9fdd3] rounded-tr-none' : 'bg-white rounded-tl-none'
                }`} style={{ whiteSpace: 'pre-wrap' }}>
                  {m.text}

                  {m.mediaType && m.mediaUrl && (
                    <div className="mt-2">
                      {m.mediaType === 'video' && (
                        <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer" className="block bg-blue-50 text-blue-600 text-xs py-2 px-3 rounded border border-blue-200 hover:bg-blue-100">▶️ {m.mediaTitle || 'Watch Video'}</a>
                      )}
                      {m.mediaType === 'image' && (
                        <img src={m.mediaUrl} alt={m.mediaTitle || ''} className="rounded max-h-40 w-full object-cover" />
                      )}
                      {(m.mediaType === 'pdf' || m.mediaType === 'ppt') && (
                        <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer" className="block bg-orange-50 text-orange-600 text-xs py-2 px-3 rounded border border-orange-200 hover:bg-orange-100">📄 {m.mediaTitle || 'View Document'}</a>
                      )}
                      {m.mediaType === 'link' && (
                        <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer" className="block bg-green-50 text-green-600 text-xs py-2 px-3 rounded border border-green-200 hover:bg-green-100">🔗 {m.mediaTitle || m.mediaUrl}</a>
                      )}
                    </div>
                  )}

                  {m.buttons && (
                    <div className="mt-2.5 flex flex-col gap-1.5">
                      {m.buttons.map(b => (
                        <button key={b} className="text-blue-500 font-semibold border border-blue-100 bg-blue-50 hover:bg-blue-100 py-1.5 px-3 rounded-md transition-colors text-xs text-center" onClick={() => handleNextStep(b)}>{b}</button>
                      ))}
                    </div>
                  )}

                  {m.options && (
                    <div className="mt-2.5">
                      <select key={`select-${m.id}`} className="w-full border border-gray-200 bg-white text-gray-900 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-green-500 outline-none"
                        onChange={(e) => { if (e.target.value) handleNextStep(e.target.value); }}
                        defaultValue="">
                        <option value="" disabled>Select an option...</option>
                        {m.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  )}

                  {m.isLocation && (
                    <button className="mt-2.5 w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 font-semibold py-1.5 px-3 rounded-md border border-green-200 hover:bg-green-100 transition-colors text-xs"
                      onClick={() => handleNextStep("📍 GPS Location Shared")}>
                      <MapPin size={14} /> {t('Share Live Location', 'लाइव स्थान साझा करें')}
                    </button>
                  )}

                  <span className="inline-block w-10"></span>
                  <span className="text-[10px] text-gray-400 absolute bottom-1 right-2">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-2.5 bg-[#f0f2f5]">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input type="text" placeholder="Type a message..."
                className="flex-1 rounded-full border-none px-4 py-2 outline-none focus:ring-2 focus:ring-green-500 text-sm shadow-sm bg-white text-gray-900 placeholder-gray-500"
                value={inputText} onChange={e => setInputText(e.target.value)} />
              <button type="submit" className="w-9 h-9 bg-[#00a884] text-white rounded-full flex items-center justify-center shadow-sm hover:bg-green-600 transition-colors flex-shrink-0">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-1">
        {!isOpen && (
          <span className="bg-gradient-to-r from-green-600 to-green-700 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap animate-bounce" style={{ animationDuration: '2s' }}>
            Apply Solar Plant ☀️
          </span>
        )}
        <button onClick={() => setIsOpen(!isOpen)}
          className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-full shadow-lg shadow-green-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all relative group"
          aria-label="Apply for Solar Plant"
          data-testid="button-solar-widget">
          {!isOpen && <div className="absolute inset-0 rounded-full border-2 border-green-400/50 animate-ping opacity-75" style={{ animationDuration: '2.5s' }}></div>}
          {isOpen ? (
            <X size={28} className="transform transition-transform rotate-90 scale-110 group-hover:rotate-180" />
          ) : (
            <SolarPanelIcon size={38} className="transform transition-transform group-hover:scale-110 duration-300" />
          )}
          {!isOpen && <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>}
        </button>
      </div>
    </div>
  );
}
