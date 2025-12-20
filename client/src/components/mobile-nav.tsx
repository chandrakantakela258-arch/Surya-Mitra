import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  LayoutDashboard, 
  Users, 
  Wallet, 
  ShoppingCart,
  UserPlus,
  FileText,
  Bell,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: any;
  label: string;
  href: string;
}

const ddpNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", href: "/ddp/dashboard" },
  { icon: Users, label: "Customers", href: "/ddp/customers" },
  { icon: UserPlus, label: "Add", href: "/ddp/customers/new" },
  { icon: Wallet, label: "Earnings", href: "/ddp/earnings" },
  { icon: ShoppingCart, label: "Store", href: "/ddp/store" },
];

const bdpNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", href: "/bdp/dashboard" },
  { icon: Users, label: "Partners", href: "/bdp/partners" },
  { icon: UserPlus, label: "Add", href: "/bdp/partners/new" },
  { icon: Wallet, label: "Wallet", href: "/bdp/wallet" },
  { icon: User, label: "Profile", href: "/profile" },
];

const adminNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Home", href: "/admin/dashboard" },
  { icon: Users, label: "Partners", href: "/admin/partners" },
  { icon: FileText, label: "Customers", href: "/admin/customers" },
  { icon: Wallet, label: "Payouts", href: "/admin/payouts" },
  { icon: Bell, label: "Alerts", href: "/notifications" },
];

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  const navItems = user.role === "admin" 
    ? adminNavItems 
    : user.role === "bdp" 
      ? bdpNavItems 
      : ddpNavItems;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden safe-area-bottom"
      data-testid="nav-mobile-bottom"
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location === item.href || location.startsWith(item.href + "/");
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center w-16 h-full gap-0.5 transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
                data-testid={`nav-mobile-${item.label.toLowerCase()}`}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
