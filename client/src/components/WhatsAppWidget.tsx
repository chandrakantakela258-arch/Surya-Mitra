import React, { useState } from 'react';
import { MessageCircle, X, ChevronRight, Share2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Replace with actual WhatsApp Bot Number
  const botNumber = "919801005212"; 
  const waLink = `https://wa.me/${botNumber}?text=Hi`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(waLink).then(() => {
      setCopied(true);
      toast({
        title: "Link Copied!",
        description: "You can now share this link with your customers.",
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end">
      {/* Popover Content */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 mb-4 w-[320px] overflow-hidden transform transition-all duration-300 ease-out origin-bottom-right">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full p-1 transition-colors"
            >
              <X size={16} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">PM Surya Ghar Solar Bot</h3>
                <p className="text-green-50 text-sm">Online • Replies instantly</p>
              </div>
            </div>
          </div>
          
          <div className="p-5 bg-slate-50">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-4 relative before:content-[''] before:absolute before:-top-2 before:left-6 before:border-8 before:border-transparent before:border-b-white focus-within:ring-2 ring-green-500/20">
              <p className="text-gray-700 text-sm leading-relaxed">
                Hi there! 👋 I'm the Divyanshi Solar AI Assistant. <br/><br/>
                Want to check prices, calculate subsidy, or book a site visit?
              </p>
              <div className="mt-2 text-[10px] text-gray-400 text-right">Just now</div>
            </div>
            
            <div className="space-y-3">
              <a 
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-xl shadow-sm shadow-green-500/30 flex items-center justify-between transition-all hover:-translate-y-0.5"
              >
                <span>Chat Now on WhatsApp</span>
                <ChevronRight size={18} />
              </a>
              
              <Button 
                variant="outline" 
                className="w-full bg-white hover:bg-gray-50 text-gray-700 border-gray-200 py-6 rounded-xl flex items-center justify-center gap-2 group"
                onClick={handleCopyLink}
              >
                {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-gray-400 group-hover:text-gray-600 transition-colors" />}
                <span className="font-medium">{copied ? "Copied!" : "Copy Shareable Link"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-gradient-to-tr from-green-500 to-green-600 text-white rounded-full shadow-lg shadow-green-500/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all relative group"
        aria-label="Chat on WhatsApp"
      >
        {/* Pulsing rings effect */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full border-2 border-green-500/50 animate-ping opacity-75" style={{ animationDuration: '2s' }}></div>
        )}
        
        {isOpen ? (
          <X size={28} className="transform transition-transform rotate-90 scale-110 group-hover:rotate-180" />
        ) : (
          <MessageCircle size={32} className="transform transition-transform group-hover:-translate-y-0.5 group-hover:scale-110" />
        )}
        
        {/* Notification Badge */}
        {!isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </button>
    </div>
  );
}
