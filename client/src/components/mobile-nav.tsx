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
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
];

const bdpNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", href: "/bdp/dashboard" },
  { icon: Users, label: "Customers", href: "/bdp/customers" },
  { icon: Wallet, label: "Wallet", href: "/bdp/wallet" },
  { icon: ShoppingCart, label: "Store", href: "/bdp/store" },
  { icon: Calculator, label: "Calculator", href: "/calculator" },
];

const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", href: "/admin/dashboard" },
  { icon: Users, label: "Partners", href: "/admin/partners" },
  { icon: FileText, label: "Journey", href: "/admin/customer-journey" },
  { icon: Receipt, label: "Expenses", href: "/admin/site-expenses" },
  { icon: GitBranch, label: "Hierarchy", href: "/admin/partner-hierarchy" },
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

  if (!user) return null;

  const navItems = user.role === "admin" 
    ? adminNavItems 
    : user.role === "bdp" 
      ? bdpNavItems 
      : user.role === "customer_partner"
        ? customerPartnerNavItems
        : ddpNavItems;

  const allNavItems = user.role === "admin" 
    ? adminNavItems 
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
              {allNavItems.map((item) => {
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
