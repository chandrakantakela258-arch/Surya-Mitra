import { useState, useEffect, useRef } from "react";
import { Send, MapPin, Sun, Sparkles, Video, FileText, Image as ImageIcon, ExternalLink } from "lucide-react";
import { indianStatesData, getDistrictsForState, getCitiesForDistrict, getDiscomsForState } from "@shared/india-data";

interface Msg {
  id: string;
  sender: "bot" | "user";
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
  labelEn: string;
  labelHi: string;
  messageEn: string;
  messageHi: string;
  inputType: string;
  options: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  mediaTitle: string | null;
  savesField: string | null;
  sortOrder: number;
  nextStepRules: BranchRule[] | null;
}

const SESSION_ID = Math.random().toString(36).substring(2, 15);

const saveLead = async (data: Record<string, string>) => {
  try {
    await fetch("/api/public/web-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: SESSION_ID, ...data }),
    });
  } catch (e) {}
};

const DYNAMIC_FIELDS = new Set(["state", "district", "city", "electricityBoard"]);

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function MediaBlock({ mediaType, mediaUrl, mediaTitle }: { mediaType: string; mediaUrl: string; mediaTitle?: string | null }) {
  if (!mediaUrl) return null;

  if (mediaType === "video") {
    const embedUrl = getYouTubeEmbedUrl(mediaUrl);
    if (embedUrl) {
      return (
        <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
          <iframe src={embedUrl} className="w-full aspect-video" allowFullScreen title={mediaTitle || "Video"} />
          {mediaTitle && <p className="text-[10px] text-gray-500 p-1.5 bg-gray-50 flex items-center gap-1"><Video size={10} /> {mediaTitle}</p>}
        </div>
      );
    }
    return (
      <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-2 bg-red-50 text-red-700 p-2 rounded-lg border border-red-200 text-xs hover:bg-red-100 transition-colors">
        <Video size={14} /> {mediaTitle || "Watch Video"} <ExternalLink size={10} />
      </a>
    );
  }

  if (mediaType === "image") {
    return (
      <div className="mt-2">
        <img src={mediaUrl} alt={mediaTitle || "Image"} className="rounded-lg max-w-full border border-gray-200" />
        {mediaTitle && <p className="text-[10px] text-gray-500 mt-1">{mediaTitle}</p>}
      </div>
    );
  }

  if (mediaType === "ppt" || mediaType === "pdf") {
    const Icon = FileText;
    const color = mediaType === "pdf" ? "red" : "orange";
    return (
      <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className={`mt-2 flex items-center gap-2 bg-${color}-50 text-${color}-700 p-2 rounded-lg border border-${color}-200 text-xs hover:bg-${color}-100 transition-colors`}>
        <Icon size={14} /> {mediaTitle || (mediaType === "pdf" ? "View PDF" : "View Presentation")} <ExternalLink size={10} />
      </a>
    );
  }

  if (mediaType === "link") {
    return (
      <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-2 bg-green-50 text-green-700 p-3 rounded-lg border border-green-200 text-xs hover:bg-green-100 transition-colors">
        <ExternalLink size={14} /> {mediaTitle || mediaUrl} <span className="text-[9px] opacity-60 ml-auto">↗</span>
      </a>
    );
  }

  return null;
}

export default function SolarBotPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [inputText, setInputText] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [nodeConfigs, setNodeConfigs] = useState<NodeConfig[]>([]);
  const [configsLoaded, setConfigsLoaded] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);

  useEffect(() => {
    fetch(`/api/public/chatbot-nodes?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setNodeConfigs(d);
        setConfigsLoaded(true);
      })
      .catch(() => {
        setConfigsLoaded(true);
      });
  }, []);

  const sortedNodes = [...nodeConfigs].sort((a, b) => a.sortOrder - b.sortOrder);

  const getNodeConfig = (stepId: string): NodeConfig | undefined => {
    return nodeConfigs.find((n) => n.stepId === stepId);
  };

  const getNextStepByRules = (stepId: string, userReply: string): string | null => {
    const node = getNodeConfig(stepId);
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
    const currentNode = getNodeConfig(stepId);
    if (!currentNode) return null;
    const currentOrder = currentNode.sortOrder;
    const nextNode = sortedNodes.find(n => n.sortOrder > currentOrder);
    return nextNode ? nextNode.stepId : null;
  };

  const getDynamicOptions = (node: NodeConfig): string[] | null => {
    if (!node.savesField || !DYNAMIC_FIELDS.has(node.savesField)) return null;
    switch (node.savesField) {
      case "state":
        return indianStatesData;
      case "district": {
        const districts = getDistrictsForState(selectedState);
        return districts.length > 0 ? districts : ["Other"];
      }
      case "city": {
        const cities = getCitiesForDistrict(selectedDistrict);
        return cities.length > 0 ? cities : ["Other"];
      }
      case "electricityBoard": {
        return getDiscomsForState(selectedState);
      }
      default:
        return null;
    }
  };

  const addBotMessage = (text: string, buttons?: string[], options?: string[], isLocation?: boolean, mediaType?: string | null, mediaUrl?: string | null, mediaTitle?: string | null) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "bot", text, buttons, options, isLocation, mediaType, mediaUrl, mediaTitle }]);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", text }]);
  };

  const showNodeMessage = (node: NodeConfig) => {
    const msg = lang === "hi" ? node.messageHi : node.messageEn;
    const dynamicOpts = getDynamicOptions(node);
    const nodeOpts = dynamicOpts || (node.options ? node.options.split(",").map((o) => o.trim()) : undefined);
    const buttons = node.inputType === "buttons" ? nodeOpts : undefined;
    const dropdown = node.inputType === "dropdown" ? nodeOpts : undefined;
    const isLoc = node.inputType === "location";
    addBotMessage(msg, buttons, dropdown, isLoc, node.mediaType, node.mediaUrl, node.mediaTitle);
  };

  const handleNextStep = (userReply: string) => {
    addUserMessage(userReply);
    setTimeout(() => {
      if (!currentStepId) return;
      const currentNode = getNodeConfig(currentStepId);

      if (currentNode?.savesField) {
        saveLead({ [currentNode.savesField]: userReply });
      }

      if (currentNode?.savesField === "language") {
        const newLang = userReply === "\u0939\u093F\u0928\u094D\u0926\u0940" ? "hi" : "en";
        setLang(newLang);
        saveLead({ language: newLang });
      }
      if (currentNode?.savesField === "state") setSelectedState(userReply);
      if (currentNode?.savesField === "district") setSelectedDistrict(userReply);

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
    if (!configsLoaded) return;
    if (initDone.current) return;
    initDone.current = true;
    setTimeout(() => {
      const firstNode = sortedNodes[0];
      if (firstNode) {
        setCurrentStepId(firstNode.stepId);
        showNodeMessage(firstNode);
      } else {
        addBotMessage("Hi! I am the PM Surya Ghar Solar Bot \u2600\uFE0F\nPlease select your language / \u0915\u0943\u092A\u092F\u093E \u092D\u093E\u0937\u093E \u091A\u0941\u0928\u0947\u0902:", ["English", "\u0939\u093F\u0928\u094D\u0926\u0940"]);
        setCurrentStepId("0");
      }
    }, 500);
  }, [configsLoaded]);

  useEffect(() => {
    if (!currentStepId) return;
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.sender !== "user") return;

    const node = getNodeConfig(currentStepId);
    if (node) {
      showNodeMessage(node);
    }
  }, [currentStepId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleNextStep(inputText);
    setInputText("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-md mb-2">
            <Sun size={20} className="text-yellow-500" />
            <span className="font-bold text-green-700 text-sm">PM Surya Ghar Solar Bot</span>
            <Sparkles size={14} className="text-yellow-400" />
          </div>
          <p className="text-xs text-green-600">Powered by Divyanshi Solar</p>
        </div>

        <div className="bg-[#e5ddd5] rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-green-600 to-green-700 p-3 text-white">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Sun size={22} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-sm" data-testid="text-bot-title">PM Surya Ghar Solar Bot</h3>
                <p className="text-green-100 text-[10px]">Online • Replies instantly</p>
              </div>
            </div>
          </div>

          <div className="h-[450px] sm:h-[500px] overflow-y-auto p-3 flex flex-col gap-2.5 bg-[#e5ddd5]">
            {messages.map((m) => (
              <div key={m.id} className={`flex w-full ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg p-2.5 shadow-sm relative text-sm text-gray-800 ${m.sender === "user" ? "bg-[#d9fdd3] rounded-tr-none" : "bg-white rounded-tl-none"}`} style={{ whiteSpace: "pre-wrap" }}>
                  {m.text}

                  {m.mediaType && m.mediaUrl && (
                    <MediaBlock mediaType={m.mediaType} mediaUrl={m.mediaUrl} mediaTitle={m.mediaTitle} />
                  )}

                  {m.buttons && (
                    <div className="mt-2.5 flex flex-col gap-1.5">
                      {m.buttons.map((b) => (
                        <button key={b} className="text-blue-500 font-semibold border border-blue-100 bg-blue-50 hover:bg-blue-100 py-1.5 px-3 rounded-md transition-colors text-xs text-center" onClick={() => handleNextStep(b)} data-testid={`button-option-${b}`}>
                          {b}
                        </button>
                      ))}
                    </div>
                  )}

                  {m.options && (
                    <div className="mt-2.5">
                      <select className="w-full border border-gray-200 bg-white text-gray-900 rounded-md p-1.5 text-xs focus:ring-2 focus:ring-green-500 outline-none" onChange={(e) => { if (e.target.value) handleNextStep(e.target.value); }} defaultValue="" data-testid="select-option">
                        <option value="" disabled>Select an option...</option>
                        {m.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  )}

                  {m.isLocation && (
                    <button className="mt-2.5 w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 font-semibold py-1.5 px-3 rounded-md border border-green-200 hover:bg-green-100 transition-colors text-xs" onClick={() => handleNextStep("\uD83D\uDCCD GPS Location Shared")} data-testid="button-share-location">
                      <MapPin size={14} /> {t("Share Live Location", "\u0932\u093E\u0907\u0935 \u0938\u094D\u0925\u093E\u0928 \u0938\u093E\u091D\u093E \u0915\u0930\u0947\u0902")}
                    </button>
                  )}

                  <span className="inline-block w-10"></span>
                  <span className="text-[10px] text-gray-400 absolute bottom-1 right-2">
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-2.5 bg-[#f0f2f5]">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input type="text" placeholder="Type a message..." className="flex-1 rounded-full border-none px-4 py-2 outline-none focus:ring-2 focus:ring-green-500 text-sm shadow-sm bg-white text-gray-900 placeholder-gray-500" value={inputText} onChange={(e) => setInputText(e.target.value)} data-testid="input-chat-message" />
              <button type="submit" className="w-9 h-9 bg-[#00a884] text-white rounded-full flex items-center justify-center shadow-sm hover:bg-green-600 transition-colors flex-shrink-0" data-testid="button-send-message">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        <div className="text-center mt-4">
          <a href="/" className="text-xs text-green-600 hover:underline" data-testid="link-home">Visit DivyanshiSolar.com</a>
        </div>
      </div>
    </div>
  );
}
