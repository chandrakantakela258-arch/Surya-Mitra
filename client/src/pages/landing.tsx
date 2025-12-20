import { Link as WouterLink } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import logoImage from "@assets/88720521_logo_1766219255006.png";
import { SiLinkedin, SiX, SiFacebook, SiInstagram } from "react-icons/si";
import { 
  Sun, 
  Zap, 
  IndianRupee, 
  FileText, 
  Users, 
  CheckCircle2, 
  ArrowRight,
  Leaf,
  Home,
  Calculator,
  Battery,
  Shield,
  TrendingUp,
  Menu,
  X,
  MapPin,
  BarChart3,
  Phone,
  Mail,
  MapPinned,
  Building2,
  ClipboardList,
  Award,
  ChevronRight
} from "lucide-react";
import { useState } from "react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16 lg:h-18">
            {/* Logo */}
            <WouterLink href="/" className="flex-shrink-0">
              <img 
                src={logoImage} 
                alt="Divyanshi Solar" 
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </WouterLink>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <button 
                onClick={() => scrollToSection("about")} 
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-about"
              >
                About
              </button>
              <button 
                onClick={() => scrollToSection("renewable-energy")} 
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-renewable"
              >
                Solar Energy
              </button>
              <button 
                onClick={() => scrollToSection("pm-surya-ghar")} 
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-pmsghy"
              >
                PM Surya Ghar
              </button>
              <button 
                onClick={() => scrollToSection("steps")} 
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-steps"
              >
                How to Apply
              </button>
              <button 
                onClick={() => scrollToSection("sunpunch")} 
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-sunpunch"
              >
                SunPunch
              </button>
              <button 
                onClick={() => scrollToSection("state-progress")} 
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-state-progress"
              >
                Progress
              </button>
              <button 
                onClick={() => scrollToSection("contact")} 
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-contact"
              >
                Contact
              </button>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <WouterLink href="/subsidy-calculator" className="hidden sm:block">
                <Button variant="outline" size="sm" className="gap-2" data-testid="button-subsidy-calculator">
                  <Calculator className="w-4 h-4" />
                  <span className="hidden md:inline">Calculate Subsidy</span>
                </Button>
              </WouterLink>
              <WouterLink href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm" data-testid="button-login">
                  Login
                </Button>
              </WouterLink>
              <WouterLink href="/register">
                <Button size="sm" className="gap-1.5" data-testid="button-join-network">
                  <span className="hidden sm:inline">Join</span> Partner
                </Button>
              </WouterLink>
              
              {/* Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="button-mobile-menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-background">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <nav className="grid grid-cols-2 gap-2 mb-4">
                <button 
                  onClick={() => scrollToSection("about")} 
                  className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-left"
                  data-testid="mobile-nav-about"
                >
                  <Building2 className="w-4 h-4 text-primary" />
                  About Us
                </button>
                <button 
                  onClick={() => scrollToSection("renewable-energy")} 
                  className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-left"
                  data-testid="mobile-nav-renewable"
                >
                  <Leaf className="w-4 h-4 text-green-600" />
                  Solar Energy
                </button>
                <button 
                  onClick={() => scrollToSection("pm-surya-ghar")} 
                  className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-left"
                  data-testid="mobile-nav-pmsghy"
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  PM Surya Ghar
                </button>
                <button 
                  onClick={() => scrollToSection("steps")} 
                  className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-left"
                  data-testid="mobile-nav-steps"
                >
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                  How to Apply
                </button>
                <button 
                  onClick={() => scrollToSection("sunpunch")} 
                  className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-left"
                  data-testid="mobile-nav-sunpunch"
                >
                  <Battery className="w-4 h-4 text-purple-600" />
                  SunPunch
                </button>
                <button 
                  onClick={() => scrollToSection("state-progress")} 
                  className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-left"
                  data-testid="mobile-nav-state-progress"
                >
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                  Progress
                </button>
                <button 
                  onClick={() => scrollToSection("contact")} 
                  className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors text-left"
                  data-testid="mobile-nav-contact"
                >
                  <Phone className="w-4 h-4 text-indigo-600" />
                  Contact
                </button>
              </nav>
              <div className="flex flex-col gap-2 pt-3 border-t">
                <WouterLink href="/subsidy-calculator">
                  <Button variant="outline" size="sm" className="w-full gap-2" data-testid="mobile-nav-subsidy">
                    <Calculator className="w-4 h-4" />
                    Calculate Subsidy
                  </Button>
                </WouterLink>
                <WouterLink href="/login">
                  <Button variant="secondary" size="sm" className="w-full" data-testid="mobile-nav-login">
                    Login
                  </Button>
                </WouterLink>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - Full Bleed Design */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-amber-500/5" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent opacity-50" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <Badge variant="secondary" className="mb-4 sm:mb-6 px-4 py-1.5">
                <Sun className="w-3.5 h-3.5 mr-1.5" />
                PM Surya Ghar Yojana Partner
              </Badge>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight mb-4 sm:mb-6">
                Power Your Home with{" "}
                <span className="text-primary">Free Solar Energy</span>
              </h1>
              
              <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto lg:mx-0">
                Join India's largest rooftop solar program. Get up to Rs 78,000 subsidy and 
                reduce your electricity bills to zero.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <WouterLink href="/subsidy-calculator">
                  <Button size="lg" className="gap-2 w-full sm:w-auto" data-testid="hero-subsidy-button">
                    <Calculator className="w-5 h-5" />
                    Check Your Subsidy
                  </Button>
                </WouterLink>
                <WouterLink href="/register">
                  <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto" data-testid="hero-partner-button">
                    Become a Partner
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </WouterLink>
              </div>
            </div>

            {/* Right Side - Stats Grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20" data-testid="card-stat-households">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary mb-1" data-testid="text-stat-households">1 Cr+</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Target Households</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20" data-testid="card-stat-subsidy">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-500 mb-1" data-testid="text-stat-subsidy">Rs 78K</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Max Subsidy</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20" data-testid="card-stat-life">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-500 mb-1" data-testid="text-stat-life">25+ Yrs</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Panel Life</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20" data-testid="card-stat-bills">
                <CardContent className="p-4 sm:p-6 text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-500 mb-1" data-testid="text-stat-bills">Zero</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Electricity Bills</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip - Horizontal Stats */}
      <section className="bg-muted/50 border-y" data-testid="section-trust-strip">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            <div className="text-center" data-testid="trust-stat-atms">
              <div className="text-xl sm:text-2xl font-bold text-foreground">300+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">ATMs Installed</div>
            </div>
            <div className="text-center" data-testid="trust-stat-partners">
              <div className="text-xl sm:text-2xl font-bold text-foreground">5,000+</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Partners Onboarded</div>
            </div>
            <div className="text-center" data-testid="trust-stat-experience">
              <div className="text-xl sm:text-2xl font-bold text-foreground">8+ Years</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Industry Experience</div>
            </div>
            <div className="text-center" data-testid="trust-stat-states">
              <div className="text-xl sm:text-2xl font-bold text-foreground">4 States</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Active Operations</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">About Divyanshi Solar</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              An authorized partner network under PM Surya Ghar Yojana, committed to helping 
              Indian households transition to clean, reliable solar energy.
            </p>
          </div>

          {/* Company Background */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 mb-10 sm:mb-12">
            <Card>
              <CardContent className="p-5 sm:p-6">
                <h3 className="font-semibold text-lg sm:text-xl mb-3 sm:mb-4">Our Legacy</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-4">
                  Divyanshi Solar is a brand of <span className="font-medium text-foreground">Divyanshi Digital Services Pvt. Ltd.</span>, 
                  incorporated on 11th December 2017, with 8+ years of experience in large-scale infrastructure projects.
                </p>
                <p className="text-sm sm:text-base text-muted-foreground">
                  We've been closely associated with Hitachi Payment Services, delivering mission-critical financial infrastructure 
                  across India. This execution excellence now powers our solar initiatives.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 sm:p-6">
                <h3 className="font-semibold text-lg sm:text-xl mb-3 sm:mb-4">Our Mission</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  To empower Indian households with clean, affordable, and reliable solar energy by delivering 
                  high-quality rooftop solar solutions under PM Surya Ghar Yojana—reducing electricity costs, 
                  strengthening energy independence, and safeguarding the future of the next generation.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Values */}
          <h3 className="font-semibold text-lg sm:text-xl mb-6 text-center">Our Values</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { icon: Shield, title: "Trust & Transparency", desc: "Complete honesty in pricing, processes, and commitments." },
              { icon: Zap, title: "Execution Excellence", desc: "Timely installation, regulatory compliance, and reliability." },
              { icon: Leaf, title: "Sustainability First", desc: "Every installation reduces carbon emissions for a greener India." },
              { icon: Users, title: "Partner Empowerment", desc: "Enabling local partners and entrepreneurs to grow with us." },
              { icon: Home, title: "Nation Building", desc: "Aligned with India's vision of energy security and self-reliance." },
              { icon: FileText, title: "Customer-Centric", desc: "Simple processes, dependable systems, and long-term support." },
            ].map((item, i) => (
              <Card key={i}>
                <CardContent className="p-5 sm:p-6">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-base sm:text-lg mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Renewable Energy */}
      <section id="renewable-energy" className="py-16 sm:py-20 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">Why Solar Energy?</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-6">
                India receives abundant sunlight throughout the year, making it ideal for solar power. 
                Harness this free, clean energy to reduce your carbon footprint and save on bills.
              </p>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { title: "Clean & Green", desc: "Zero emissions, sustainable power" },
                  { title: "Energy Independence", desc: "Generate your own electricity" },
                  { title: "90% Cost Savings", desc: "Drastically reduce electricity bills" },
                  { title: "Government Support", desc: "Attractive subsidies for all" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-sm sm:text-base">{item.title}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { icon: Leaf, title: "Eco-Friendly", value: "3-4 tons", desc: "CO2 reduced/year", testId: "card-benefit-eco" },
                { icon: IndianRupee, title: "Savings", value: "Rs 15K+", desc: "saved per year", testId: "card-benefit-savings" },
                { icon: Home, title: "Property Value", value: "+10%", desc: "increase in value", testId: "card-benefit-property" },
                { icon: TrendingUp, title: "ROI", value: "5 Years", desc: "payback period", testId: "card-benefit-roi" },
              ].map((item, i) => (
                <Card key={i} className="bg-primary/5 border-primary/20" data-testid={item.testId}>
                  <CardContent className="p-4 sm:p-6 text-center">
                    <item.icon className="w-8 h-8 sm:w-10 sm:h-10 text-primary mx-auto mb-2 sm:mb-3" />
                    <div className="font-bold text-lg sm:text-xl mb-0.5">{item.value}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{item.desc}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PM Surya Ghar Yojana */}
      <section id="pm-surya-ghar" className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-1.5">
              <Sun className="w-3.5 h-3.5 mr-1.5" />
              Government Initiative
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">PM Surya Ghar Yojana</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              A flagship scheme to provide free electricity to 1 crore households through rooftop solar installations.
            </p>
          </div>

          {/* Subsidy Table */}
          <Card className="mb-8 sm:mb-10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 sm:p-4 text-sm font-semibold">Capacity</th>
                    <th className="text-left p-3 sm:p-4 text-sm font-semibold">Central Subsidy</th>
                    <th className="text-left p-3 sm:p-4 text-sm font-semibold">State Bonus</th>
                    <th className="text-left p-3 sm:p-4 text-sm font-semibold">Total Benefit</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-3 sm:p-4 text-sm">1 kW</td>
                    <td className="p-3 sm:p-4 text-sm font-medium text-primary">Rs 30,000</td>
                    <td className="p-3 sm:p-4 text-sm text-muted-foreground">+Rs 10-20K</td>
                    <td className="p-3 sm:p-4 text-sm font-semibold">Rs 40-50K</td>
                  </tr>
                  <tr>
                    <td className="p-3 sm:p-4 text-sm">2 kW</td>
                    <td className="p-3 sm:p-4 text-sm font-medium text-primary">Rs 60,000</td>
                    <td className="p-3 sm:p-4 text-sm text-muted-foreground">+Rs 20-40K</td>
                    <td className="p-3 sm:p-4 text-sm font-semibold">Rs 80-100K</td>
                  </tr>
                  <tr className="bg-primary/5">
                    <td className="p-3 sm:p-4 text-sm font-medium">3 kW (Max Subsidy)</td>
                    <td className="p-3 sm:p-4 text-sm font-bold text-primary">Rs 78,000</td>
                    <td className="p-3 sm:p-4 text-sm text-muted-foreground">+Rs 30-60K</td>
                    <td className="p-3 sm:p-4 text-sm font-bold">Rs 108-138K</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Eligibility */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-5 sm:p-6">
                <h3 className="font-semibold text-lg mb-4">Eligibility Criteria</h3>
                <ul className="space-y-2 sm:space-y-3">
                  {[
                    "Residential property with rooftop ownership",
                    "Valid electricity connection",
                    "Shadow-free rooftop area",
                    "Valid ID proof (Aadhaar, PAN)",
                    "Bank account linked to Aadhaar"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 sm:p-6">
                <h3 className="font-semibold text-lg mb-4">Key Benefits</h3>
                <ul className="space-y-2 sm:space-y-3">
                  {[
                    "300 units free electricity per month",
                    "Subsidy directly credited to bank",
                    "25+ years panel warranty",
                    "Net metering for excess power",
                    "Easy EMI options available"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How to Apply */}
      <section id="steps" className="py-16 sm:py-20 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">How to Apply</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple 6-step process to get solar panels installed on your rooftop
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { step: "1", title: "Register Online", desc: "Apply on PM Surya Ghar portal with Aadhaar and electricity bill" },
              { step: "2", title: "Choose Vendor", desc: "Select Divyanshi Solar as your authorized installation partner" },
              { step: "3", title: "Site Survey", desc: "Our team visits to assess rooftop and plan installation" },
              { step: "4", title: "Installation", desc: "Solar panels and inverter installed by certified technicians" },
              { step: "5", title: "Net Metering", desc: "DISCOM installs bidirectional meter for export credit" },
              { step: "6", title: "Get Subsidy", desc: "Subsidy transferred directly to your bank account" },
            ].map((item, i) => (
              <Card key={i} className="relative" data-testid={`card-step-${item.step}`}>
                <CardContent className="p-5 sm:p-6">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold mb-4">
                    {item.step}
                  </div>
                  <h4 className="font-semibold text-base sm:text-lg mb-2">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8 sm:mt-10">
            <WouterLink href="/subsidy-calculator">
              <Button size="lg" className="gap-2" data-testid="steps-cta-button">
                <Calculator className="w-5 h-5" />
                Calculate Your Subsidy Now
              </Button>
            </WouterLink>
          </div>
        </div>
      </section>

      {/* SunPunch Products */}
      <section id="sunpunch" className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <Badge variant="secondary" className="mb-4 px-4 py-1.5">
              <Battery className="w-3.5 h-3.5 mr-1.5" />
              Premium Products
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">SunPunch 3-in-1 Inverter</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Advanced hybrid inverter with solar charging, battery backup, and grid connectivity
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-center">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Why Choose SunPunch?</h3>
              <div className="space-y-4">
                {[
                  { title: "3-in-1 Technology", desc: "Solar + Grid + Battery in single unit" },
                  { title: "Pure Sinewave Output", desc: "Safe for all appliances" },
                  { title: "Smart LCD Display", desc: "Real-time monitoring and control" },
                  { title: "5 Year Warranty", desc: "Comprehensive coverage" },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-lg bg-muted/50">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{item.title}</div>
                      <div className="text-sm text-muted-foreground">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { capacity: "1 kVA", price: "Rs 8,500", testId: "card-sunpunch-1kva" },
                { capacity: "1.5 kVA", price: "Rs 11,000", testId: "card-sunpunch-1.5kva" },
                { capacity: "2 kVA", price: "Rs 14,500", testId: "card-sunpunch-2kva" },
                { capacity: "3 kVA", price: "Rs 22,000", testId: "card-sunpunch-3kva" },
              ].map((item, i) => (
                <Card key={i} data-testid={item.testId}>
                  <CardContent className="p-4 sm:p-6 text-center">
                    <div className="text-lg sm:text-xl font-bold mb-1">{item.capacity}</div>
                    <div className="text-primary font-semibold text-sm sm:text-base">{item.price}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* State Progress */}
      <section id="state-progress" className="py-16 sm:py-20 lg:py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">State Progress</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Track PM Surya Ghar Yojana implementation across our active states
            </p>
          </div>

          <Tabs defaultValue="bihar" className="w-full">
            <TabsList className="w-full flex-wrap h-auto gap-1 sm:gap-2 p-1 mb-6 sm:mb-8">
              <TabsTrigger value="bihar" className="flex-1 min-w-[100px]" data-testid="tab-bihar">Bihar</TabsTrigger>
              <TabsTrigger value="jharkhand" className="flex-1 min-w-[100px]" data-testid="tab-jharkhand">Jharkhand</TabsTrigger>
              <TabsTrigger value="up" className="flex-1 min-w-[100px]" data-testid="tab-up">Uttar Pradesh</TabsTrigger>
              <TabsTrigger value="odisha" className="flex-1 min-w-[100px]" data-testid="tab-odisha">Odisha</TabsTrigger>
            </TabsList>

            {[
              { id: "bihar", name: "Bihar", registered: "15.2 Lakh", installed: "1.8 Lakh", subsidy: "Rs 1,200 Cr" },
              { id: "jharkhand", name: "Jharkhand", registered: "8.5 Lakh", installed: "95,000", subsidy: "Rs 650 Cr" },
              { id: "up", name: "Uttar Pradesh", registered: "28.7 Lakh", installed: "3.2 Lakh", subsidy: "Rs 2,100 Cr", bonus: "+Rs 10,000/kW" },
              { id: "odisha", name: "Odisha", registered: "10.3 Lakh", installed: "1.2 Lakh", subsidy: "Rs 850 Cr", bonus: "+Rs 20,000/kW" },
            ].map((state) => (
              <TabsContent key={state.id} value={state.id} data-testid={`tab-content-${state.id}`}>
                <Card data-testid={`card-state-${state.id}`}>
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6">
                      <MapPin className="w-5 h-5 text-primary" />
                      <h3 className="text-lg sm:text-xl font-bold">{state.name}</h3>
                      {state.bonus && (
                        <Badge variant="secondary" className="text-xs">{state.bonus} State Bonus</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 sm:gap-6">
                      <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-primary">{state.registered}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Registered</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">{state.installed}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Installed</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-muted/50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-amber-600">{state.subsidy}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Disbursed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          <div className="mt-6 sm:mt-8 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Data from PM Surya Ghar portal. Updated December 2024.
            </p>
            <WouterLink href="/register">
              <Button className="gap-2" data-testid="button-state-become-partner">
                <Users className="w-4 h-4" />
                Become a Partner in Your State
              </Button>
            </WouterLink>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Ready to Go Solar?</h2>
          <p className="text-base sm:text-lg opacity-90 mb-6 sm:mb-8">
            Join thousands of households already benefiting from free solar electricity.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <WouterLink href="/subsidy-calculator">
              <Button size="lg" variant="secondary" className="gap-2 w-full sm:w-auto" data-testid="cta-subsidy-button">
                <Calculator className="w-5 h-5" />
                Check Your Subsidy
              </Button>
            </WouterLink>
            <WouterLink href="/register">
              <Button 
                size="lg" 
                variant="outline" 
                className="gap-2 w-full sm:w-auto bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" 
                data-testid="cta-partner-button"
              >
                <Users className="w-5 h-5" />
                Join Partner Network
              </Button>
            </WouterLink>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">Contact Us</h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Get in touch for solar installation inquiries or partnership opportunities
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card>
              <CardContent className="p-5 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <MapPinned className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Office Address</h3>
                <p className="text-sm text-muted-foreground">
                  PIPARWAN, PANCHAYAT-JAITIPUR,<br />
                  NAUBATPUR, PATNA 800014
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Chandrakant Akela</h3>
                <p className="text-sm text-muted-foreground">
                  <a href="tel:9801005212" className="hover:text-primary">9801005212</a> / <a href="tel:8709127232" className="hover:text-primary">8709127232</a>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <a href="mailto:chandrakant@divyanshisolar.com" className="hover:text-primary">chandrakant@divyanshisolar.com</a>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Anil</h3>
                <p className="text-sm text-muted-foreground">
                  <a href="tel:9123141987" className="hover:text-primary">9123141987</a>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <a href="mailto:anil@divyanshisolar.com" className="hover:text-primary">anil@divyanshisolar.com</a>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 sm:p-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3 sm:mb-4">
                  <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-base sm:text-lg mb-2">Sanjay</h3>
                <p className="text-sm text-muted-foreground">
                  <a href="tel:8777684575" className="hover:text-primary">8777684575</a>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  <a href="mailto:sanjay@divyanshisolar.com" className="hover:text-primary">sanjay@divyanshisolar.com</a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 sm:py-12 border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-8">
            {/* Company Info */}
            <div className="sm:col-span-2 lg:col-span-1">
              <img 
                src={logoImage} 
                alt="Divyanshi Solar" 
                className="h-10 sm:h-12 w-auto object-contain mb-4"
              />
              <p className="text-sm text-muted-foreground mb-2">
                A brand of Divyanshi Digital Services Pvt. Ltd.
              </p>
              <p className="text-xs text-muted-foreground">
                Authorized PM Surya Ghar Yojana Partner
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4">Quick Links</h4>
              <div className="flex flex-col gap-2">
                <WouterLink href="/subsidy-calculator" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Subsidy Calculator
                </WouterLink>
                <WouterLink href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Partner Login
                </WouterLink>
                <WouterLink href="/register" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Join Network
                </WouterLink>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4">Legal</h4>
              <div className="flex flex-col gap-2">
                <WouterLink href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </WouterLink>
                <WouterLink href="/disclaimer" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Disclaimer
                </WouterLink>
                <WouterLink href="/terms-and-conditions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Terms and Conditions
                </WouterLink>
              </div>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-semibold mb-3 sm:mb-4">Follow Us</h4>
              <div className="flex gap-2">
                <a 
                  href="https://www.linkedin.com/in/chandrakant-akela-a1479a18" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  data-testid="link-linkedin"
                >
                  <SiLinkedin className="w-4 h-4" />
                </a>
                <a 
                  href="https://x.com/chandu532" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  data-testid="link-twitter"
                >
                  <SiX className="w-4 h-4" />
                </a>
                <a 
                  href="https://www.facebook.com/nayabharatdivyanshi" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  data-testid="link-facebook"
                >
                  <SiFacebook className="w-4 h-4" />
                </a>
                <a 
                  href="https://www.instagram.com/chandu532/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  data-testid="link-instagram"
                >
                  <SiInstagram className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-6 sm:pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              2024 Divyanshi Digital Services Pvt. Ltd. All rights reserved.
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              Powering India with Solar Energy
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
