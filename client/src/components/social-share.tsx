import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, MessageCircle, Check, Copy } from "lucide-react";
import { SiFacebook, SiX, SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

const WEBSITE_URL = "https://divyanshisolar.com/";
const HASHTAGS = "#DivyanshiSolar #PMSuryaGhar #SolarEnergy #RooftopSolar #GreenEnergy #MakeInIndia #SolarPower #CleanEnergy";

interface SocialShareProps {
  title: string;
  description: string;
  customerName?: string;
  capacity?: string;
  district?: string;
  state?: string;
  panelType?: string;
  imageUrl?: string;
  variant?: "button" | "dropdown" | "icon";
  size?: "default" | "sm" | "lg" | "icon";
}

export function SocialShare({
  title,
  description,
  customerName,
  capacity,
  district,
  state,
  panelType,
  imageUrl,
  variant = "dropdown",
  size = "default",
}: SocialShareProps) {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const buildShareText = () => {
    let text = `${title}\n\n${description}`;
    
    if (customerName) text += `\n\nCustomer: ${customerName}`;
    if (capacity) text += `\nCapacity: ${capacity} kW`;
    if (district && state) text += `\nLocation: ${district}, ${state}`;
    if (panelType) text += `\nPanel Type: ${panelType === "dcr" ? "DCR (Made in India)" : "Non-DCR"}`;
    
    text += `\n\nPowered by Divyanshi Solar - PM Surya Ghar Yojana Partner`;
    text += `\nVisit: ${WEBSITE_URL}`;
    text += `\n\n${HASHTAGS}`;
    
    return text;
  };

  const shareText = buildShareText();
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(WEBSITE_URL);

  const shareToFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    window.open(fbUrl, "_blank", "width=600,height=400");
  };

  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    window.open(twitterUrl, "_blank", "width=600,height=400");
  };

  const shareToWhatsApp = () => {
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(whatsappUrl, "_blank");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      toast({ title: "Copied to clipboard!" });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: shareText,
          url: WEBSITE_URL,
        });
      } catch (error) {
        setShowDialog(true);
      }
    } else {
      setShowDialog(true);
    }
  };

  if (variant === "icon") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" data-testid="button-share-social">
              <Share2 className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={shareToWhatsApp} data-testid="menu-share-whatsapp">
              <SiWhatsapp className="w-4 h-4 mr-2 text-green-500" />
              WhatsApp
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareToFacebook} data-testid="menu-share-facebook">
              <SiFacebook className="w-4 h-4 mr-2 text-blue-600" />
              Facebook
            </DropdownMenuItem>
            <DropdownMenuItem onClick={shareToTwitter} data-testid="menu-share-twitter">
              <SiX className="w-4 h-4 mr-2" />
              X (Twitter)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyToClipboard} data-testid="menu-copy-text">
              {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
              Copy Text
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  }

  if (variant === "button") {
    return (
      <>
        <Button onClick={handleNativeShare} size={size} data-testid="button-share-social">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
        <ShareDialog 
          open={showDialog} 
          onOpenChange={setShowDialog}
          shareText={shareText}
          onFacebook={shareToFacebook}
          onTwitter={shareToTwitter}
          onWhatsApp={shareToWhatsApp}
          onCopy={copyToClipboard}
          copied={copied}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size={size} variant="outline" data-testid="button-share-social">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={shareToWhatsApp} data-testid="menu-share-whatsapp">
            <SiWhatsapp className="w-4 h-4 mr-2 text-green-500" />
            Share on WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToFacebook} data-testid="menu-share-facebook">
            <SiFacebook className="w-4 h-4 mr-2 text-blue-600" />
            Share on Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareToTwitter} data-testid="menu-share-twitter">
            <SiX className="w-4 h-4 mr-2" />
            Share on X (Twitter)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={copyToClipboard} data-testid="menu-copy-text">
            {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
            Copy to Clipboard
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareText: string;
  onFacebook: () => void;
  onTwitter: () => void;
  onWhatsApp: () => void;
  onCopy: () => void;
  copied: boolean;
}

function ShareDialog({ 
  open, 
  onOpenChange, 
  shareText, 
  onFacebook, 
  onTwitter, 
  onWhatsApp, 
  onCopy,
  copied 
}: ShareDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share on Social Media</DialogTitle>
          <DialogDescription>
            Share this installation update with your network
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-md text-sm max-h-40 overflow-y-auto whitespace-pre-wrap">
            {shareText}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button 
              onClick={onWhatsApp} 
              className="bg-green-500 hover:bg-green-600"
              data-testid="button-dialog-whatsapp"
            >
              <SiWhatsapp className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button 
              onClick={onFacebook}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid="button-dialog-facebook"
            >
              <SiFacebook className="w-4 h-4 mr-2" />
              Facebook
            </Button>
            <Button 
              onClick={onTwitter}
              className="bg-black hover:bg-gray-800"
              data-testid="button-dialog-twitter"
            >
              <SiX className="w-4 h-4 mr-2" />
              X (Twitter)
            </Button>
            <Button 
              onClick={onCopy}
              variant="outline"
              data-testid="button-dialog-copy"
            >
              {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? "Copied!" : "Copy Text"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InstallationShareCard({ 
  customer 
}: { 
  customer: { 
    name: string; 
    proposedCapacity?: string | null; 
    panelType?: string | null; 
    district?: string | null; 
    state?: string | null;
    sitePictures?: string[] | null;
    currentMilestone?: string | null;
  } 
}) {
  const isCompleted = customer.currentMilestone === "subsidy_disbursement";
  
  return (
    <SocialShare
      title={isCompleted ? "Solar Installation Completed!" : "Solar Installation in Progress"}
      description={isCompleted 
        ? "Another successful solar installation under PM Surya Ghar Muft Bijli Yojana! Helping families save on electricity and go green."
        : "Solar installation is in progress under PM Surya Ghar Muft Bijli Yojana. More clean energy for India!"
      }
      customerName={customer.name}
      capacity={customer.proposedCapacity || undefined}
      district={customer.district || undefined}
      state={customer.state || undefined}
      panelType={customer.panelType || undefined}
      imageUrl={customer.sitePictures?.[0]}
      variant="dropdown"
      size="sm"
    />
  );
}
