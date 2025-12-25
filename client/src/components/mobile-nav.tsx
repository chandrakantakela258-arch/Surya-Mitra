import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  ShoppingCart,
  UserPlus,
  FileText,
  User,
  GitBranch,
  Receipt,
  Calculator,
  Menu,
  LogOut,
  X,
  UserCheck,
  CreditCard,
  Wrench,
  MessageSquare,
  Truck,
  ClipboardCheck,
  MessagesSquare,
  Share2,
  Globe
} from "lucide-react";
import { SiFacebook, SiX, SiWhatsapp } from "react-icons/si";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const WEBSITE_URL = "https://divyanshisolar.com/";
const HASHTAGS = "#DivyanshiSolar #PMSuryaGhar #SolarEnergy #RooftopSolar #GreenEnergy #MakeInIndia";

interface NavItem {
  icon: any;
  label: string;
  href: string;
}

const ddpNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", href: "/ddp/dashboard" },
  { icon: Users, label: "Customers", href: "/ddp/customers" },
  { icon: Calculator, label: "Calculator", href: "/calculator" },
  { icon: Wallet, label: "Earnings", href: "/ddp/earnings" },
  { icon: ShoppingCart, label: "Store", href: "/ddp/store" },
  { icon: User, label: "Profile", href: "/profile" },
];

const bdpNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", href: "/bdp/dashboard" },
  { icon: Users, label: "Customers", href: "/bdp/customers" },
  { icon: Wallet, label: "Wallet", href: "/bdp/wallet" },
  { icon: ShoppingCart, label: "Store", href: "/bdp/store" },
  { icon: Calculator, label: "Calculator", href: "/calculator" },
  { icon: User, label: "Profile", href: "/profile" },
];

// Bottom bar items for admin (first 4 shown in bottom nav)
const adminBottomNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", href: "/admin/dashboard" },
  { icon: Users, label: "Partners", href: "/admin/partners" },
  { icon: FileText, label: "Journey", href: "/admin/customer-journey" },
  { icon: Receipt, label: "Expenses", href: "/admin/site-expenses" },
];

// Additional menu items for admin (shown in More menu only)
const adminMenuItems: NavItem[] = [
  { icon: GitBranch, label: "Hierarchy", href: "/admin/partner-hierarchy" },
  { icon: UserCheck, label: "Partner Approval", href: "/admin/partners" },
  { icon: CreditCard, label: "Commission Payout", href: "/admin/payouts" },
  { icon: Wrench, label: "Service Requests", href: "/admin/service-requests" },
  { icon: MessageSquare, label: "Testimonials", href: "/admin/testimonials" },
  { icon: Truck, label: "Vendor Payments", href: "/admin/vendor-payments" },
  { icon: ClipboardCheck, label: "Vendor Approval", href: "/admin/vendors" },
  { icon: MessagesSquare, label: "User Feedback", href: "/admin/feedback" },
];

const customerPartnerNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", href: "/customer-partner/dashboard" },
  { icon: UserPlus, label: "Refer", href: "/customer-registration" },
  { icon: Users, label: "Referrals", href: "/customer-partner/referrals" },
  { icon: Wallet, label: "Earnings", href: "/customer-partner/earnings" },
  { icon: User, label: "Profile", href: "/customer-partner/profile" },
];

export function MobileNav() {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const { toast } = useToast();

  if (!user) return null;

  const shareText = `Join Divyanshi Solar - India's trusted partner for PM Surya Ghar Muft Bijli Yojana! Get FREE rooftop solar installation with government subsidy.\n\nVisit: ${WEBSITE_URL}\n\n${HASHTAGS}`;
  const encodedText = encodeURIComponent(shareText);

  const shareToFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(WEBSITE_URL)}&quote=${encodedText}`;
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

  const openWebsite = () => {
    window.open(WEBSITE_URL, "_blank");
  };

  // Bottom nav items (first 4 shown)
  const navItems = user.role === "admin" 
    ? adminBottomNavItems 
    : user.role === "bdp" 
      ? bdpNavItems 
      : user.role === "customer_partner"
        ? customerPartnerNavItems
        : ddpNavItems;

  // Menu items for More section (admin gets separate menu items, others get full list)
  const menuItems = user.role === "admin" 
    ? adminMenuItems 
    : user.role === "bdp" 
      ? bdpNavItems 
      : user.role === "customer_partner"
        ? customerPartnerNavItems
        : ddpNavItems;

  const handleSignOut = async () => {
    setMenuOpen(false);
    await logout();
    setLocation("/");
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t md:hidden safe-area-bottom"
      data-testid="nav-mobile-bottom"
    >
      <div className="flex items-center justify-evenly h-16 w-full px-1">
        {navItems.slice(0, 4).map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center min-w-[52px] flex-1 h-full gap-0.5 transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
                data-testid={`nav-mobile-${item.label.toLowerCase()}`}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-medium truncate max-w-[52px]">{item.label}</span>
              </div>
            </Link>
          );
        })}
        
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center min-w-[52px] flex-1 h-full gap-0.5 text-muted-foreground"
              data-testid="nav-mobile-menu"
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px]">
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-1">
              {menuItems.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href + "/");
                const Icon = item.icon;
                
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-md transition-colors hover-elevate",
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "text-foreground"
                      )}
                      data-testid={`nav-menu-${item.label.toLowerCase()}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <Separator className="my-4" />
            <div className="px-3 mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Share & Connect</p>
            </div>
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3"
                onClick={openWebsite}
                data-testid="button-mobile-website"
              >
                <Globe className="h-5 w-5 text-primary" />
                <span className="font-medium">Visit Website</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3"
                onClick={shareToWhatsApp}
                data-testid="button-mobile-share-whatsapp"
              >
                <SiWhatsapp className="h-5 w-5 text-green-500" />
                <span className="font-medium">Share on WhatsApp</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3"
                onClick={shareToFacebook}
                data-testid="button-mobile-share-facebook"
              >
                <SiFacebook className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Share on Facebook</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3"
                onClick={shareToTwitter}
                data-testid="button-mobile-share-twitter"
              >
                <SiX className="h-5 w-5" />
                <span className="font-medium">Share on X (Twitter)</span>
              </Button>
            </div>
            <Separator className="my-4" />
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleSignOut}
                data-testid="button-mobile-signout"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Sign Out</span>
              </Button>
            </div>
            <div className="mt-6 px-3">
              <div className="text-sm text-muted-foreground">
                Signed in as
              </div>
              <div className="font-medium truncate">{user.name}</div>
              <div className="text-sm text-muted-foreground capitalize">{user.role.replace("_", " ")}</div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
