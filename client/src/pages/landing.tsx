import { Link as WouterLink } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeroSlider } from "@/components/hero-slider";
import { FeedbackDialog } from "@/components/feedback-dialog";
import logoImage from "@assets/88720521_logo_1766219255006.png";
import { SiLinkedin, SiX, SiFacebook, SiInstagram } from "react-icons/si";
import { 
  Sun, 
  Zap, 
  IndianRupee, 
  FileText, 
  Users, 
  CheckCircle2,
  CheckCircle, 
  ArrowRight,
  Leaf,
  Home,
  Calculator,
  Battery,
  Wifi,
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
  Sparkles,
  ChevronDown,
  Globe,
  Award,
  Headphones,
  AlertTriangle,
  Clock,
  MessageSquare,
  Map,
  Store
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
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src={logoImage} 
                alt="Divyanshi Solar - Powering Every Home" 
                className="h-12 sm:h-14 w-auto object-contain"
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <button 
                onClick={() => scrollToSection("about")} 
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                data-testid="nav-about"
              >
                <Building2 className="w-4 h-4" />
                About Us
              </button>
              <button 
                onClick={() => scrollToSection("sunpunch")} 
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                data-testid="nav-sunpunch"
              >
                <Battery className="w-4 h-4" />
                SunPunch
              </button>
              <button 
                onClick={() => scrollToSection("state-progress")} 
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                data-testid="nav-state-progress"
              >
                <BarChart3 className="w-4 h-4" />
                Progress
              </button>
              <WouterLink href="/network-map">
                <button 
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  data-testid="nav-network-map"
                >
                  <Map className="w-4 h-4" />
                  Partner Map
                </button>
              </WouterLink>
              <WouterLink href="/vendor-registration">
                <button 
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  data-testid="nav-vendor-registration"
                >
                  <Store className="w-4 h-4" />
                  Vendor
                </button>
              </WouterLink>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <WouterLink href="/subsidy-calculator">
                <Button variant="outline" size="sm" className="hidden md:flex gap-2 border-primary/30 text-primary hover:bg-primary/10" data-testid="button-subsidy-calculator">
                  <Calculator className="w-4 h-4" />
                  <span className="hidden lg:inline">Subsidy</span> Calculator
                </Button>
              </WouterLink>
              <WouterLink href="/login">
                <Button variant="ghost" size="sm" data-testid="button-login">
                  Login
                </Button>
              </WouterLink>
              <WouterLink href="/register">
                <Button size="sm" className="gap-1.5 bg-gradient-to-r from-primary to-amber-500 hover:from-primary/90 hover:to-amber-500/90 shadow-md" data-testid="button-join-network">
                  <Award className="w-4 h-4" />
                  <span className="hidden sm:inline">Join Network</span>
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

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="lg:hidden py-4 border-t">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button 
                  onClick={() => scrollToSection("about")} 
                  className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left"
                  data-testid="mobile-nav-about"
                >
                  <Building2 className="w-4 h-4 text-primary" />
                  About Us
                </button>
                <button 
                  onClick={() => scrollToSection("sunpunch")} 
                  className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left"
                  data-testid="mobile-nav-sunpunch"
                >
                  <Battery className="w-4 h-4 text-purple-500" />
                  SunPunch
                </button>
                <button 
                  onClick={() => scrollToSection("state-progress")} 
                  className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left"
                  data-testid="mobile-nav-state-progress"
                >
                  <BarChart3 className="w-4 h-4 text-teal-500" />
                  State Progress
                </button>
                <WouterLink href="/network-map" onClick={() => setMobileMenuOpen(false)}>
                  <div 
                    className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left"
                    data-testid="mobile-nav-network-map"
                  >
                    <Map className="w-4 h-4 text-indigo-500" />
                    Partner Network Map
                  </div>
                </WouterLink>
                <WouterLink href="/vendor-registration" onClick={() => setMobileMenuOpen(false)}>
                  <div 
                    className="flex items-center gap-2 p-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-left"
                    data-testid="mobile-nav-vendor-registration"
                  >
                    <Store className="w-4 h-4 text-orange-500" />
                    Vendor Registration
                  </div>
                </WouterLink>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t">
                <WouterLink href="/subsidy-calculator">
                  <Button variant="outline" size="sm" className="w-full gap-2 border-primary/30" data-testid="mobile-nav-subsidy">
                    <Calculator className="w-4 h-4 text-primary" />
                    Subsidy Calculator
                  </Button>
                </WouterLink>
                <a href="tel:+919801005212">
                  <Button variant="secondary" size="sm" className="w-full gap-2">
                    <Phone className="w-4 h-4" />
                    Call: +91 9801005212
                  </Button>
                </a>
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 -z-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sun className="w-4 h-4" />
              PM Surya Ghar Yojana Partner Network
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Power Your Home with
              <span className="text-primary block mt-2">Free Solar Energy</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join India's largest rooftop solar installation program. Get up to Rs 78,000 subsidy 
              and reduce your electricity bills to zero.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <WouterLink href="/subsidy-calculator">
                <Button size="lg" className="gap-2 w-full sm:w-auto" data-testid="hero-subsidy-button">
                  <Calculator className="w-5 h-5" />
                  Check Your Subsidy
                </Button>
              </WouterLink>
              <WouterLink href="/register">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto" data-testid="hero-partner-button">
                  Become a Partner
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </WouterLink>
            </div>
          </div>

        </div>

        {/* Hero Image Slider - Full Width */}
        <div className="mt-12">
          <HeroSlider />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary">1 Crore+</div>
                <div className="text-sm text-muted-foreground mt-1">Target Households</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary">Rs 78,000</div>
                <div className="text-sm text-muted-foreground mt-1">Max Subsidy (3 kW)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary">25+ Years</div>
                <div className="text-sm text-muted-foreground mt-1">Panel Life</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-primary">Zero</div>
                <div className="text-sm text-muted-foreground mt-1">Electricity Bills</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Solar is Essential Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-full text-sm font-medium mb-6">
              <AlertTriangle className="w-4 h-4" />
              India's Energy Challenge
            </div>
            <h2 className="text-3xl font-bold mb-4">Why Every Indian Home Needs Solar</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              With rising electricity costs and growing energy demands, rooftop solar is no longer optional—it's essential for India's energy security and your family's financial future.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            <Card className="border-l-4 border-l-destructive">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Rising Electricity Costs</h3>
                    <p className="text-sm text-muted-foreground">
                      Electricity tariffs have increased by 30-50% in the last 5 years across most Indian states. Solar locks in your energy costs for 25+ years.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Growing Energy Demand</h3>
                    <p className="text-sm text-muted-foreground">
                      With EVs, ACs, and smart appliances, household energy consumption is doubling every decade. Solar ensures you're prepared.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Limited Time Subsidy</h3>
                    <p className="text-sm text-muted-foreground">
                      PM Surya Ghar Yojana offers up to Rs 78,000 subsidy only until 2027. After that, you pay full price for the same system.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <IndianRupee className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Earn From Surplus Power</h3>
                    <p className="text-sm text-muted-foreground">
                      Net metering allows you to sell excess electricity back to the grid. Turn your rooftop into a passive income source.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Leaf className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">720 Million Tonnes CO2 Saved</h3>
                    <p className="text-sm text-muted-foreground">
                      Over 25 years, PM Surya Ghar installations will reduce carbon emissions equivalent to planting 3 billion trees.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">17 Lakh Jobs Created</h3>
                    <p className="text-sm text-muted-foreground">
                      The solar revolution is creating employment across manufacturing, installation, and maintenance sectors nationwide.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold mb-4">The Math is Simple</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span><strong>300+ units free</strong> electricity per month with 3kW system</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span><strong>Rs 3,000-5,000</strong> monthly savings on electricity bills</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span><strong>4-5 years payback</strong> period after subsidy</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span><strong>Rs 15-20 lakh savings</strong> over 25-year panel life</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary mb-2">10 Lakh+</div>
                  <div className="text-lg text-muted-foreground mb-4">Indian Homes Already Solar Powered</div>
                  <WouterLink href="/subsidy-calculator">
                    <Button size="lg" className="gap-2" data-testid="button-check-savings">
                      <Calculator className="w-5 h-5" />
                      Calculate Your Savings
                    </Button>
                  </WouterLink>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">About Divyanshi Solar</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Divyanshi Solar is an authorized partner network under PM Surya Ghar Yojana, committed to helping 
              Indian households transition to clean, reliable, and affordable solar energy.
            </p>
          </div>

          {/* Company Background */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold text-xl mb-4">Our Legacy</h3>
              <p className="text-muted-foreground mb-4">
                Divyanshi Solar is a brand of <span className="font-medium text-foreground">Divyanshi Digital Services Pvt. Ltd.</span>, 
                a company incorporated on 11th December 2017, with a strong legacy of executing large-scale, 
                technology-driven infrastructure projects across India.
              </p>
              <p className="text-muted-foreground mb-4">
                For the last 8 years, we have been closely associated with Hitachi Payment Services Pvt. Ltd., 
                delivering mission-critical financial infrastructure:
              </p>
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">300+</div>
                  <div className="text-sm text-muted-foreground">White Label ATMs Installed</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">500+</div>
                  <div className="text-sm text-muted-foreground">ATMs Sourced for Banks</div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary">5,000+</div>
                  <div className="text-sm text-muted-foreground">Partners Onboarded</div>
                </div>
              </div>
              <p className="text-muted-foreground">
                This deep experience in nationwide deployment, compliance, partner management, and operations 
                forms the backbone of Divyanshi Solar. Today, we are applying the same execution excellence to 
                the renewable energy sector.
              </p>
            </CardContent>
          </Card>

          {/* Mission */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h3 className="font-semibold text-xl mb-4">Our Mission</h3>
              <p className="text-muted-foreground">
                To empower Indian households with clean, affordable, and reliable solar energy by delivering 
                high-quality rooftop solar solutions under PM Surya Ghar Yojana—while reducing electricity costs, 
                strengthening energy independence, and safeguarding the future of the next generation.
              </p>
            </CardContent>
          </Card>

          {/* Values */}
          <h3 className="font-semibold text-xl mb-6 text-center">Our Values</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Trust & Transparency</h4>
                <p className="text-muted-foreground text-sm">
                  We operate with complete honesty in pricing, processes, and commitments—building long-term 
                  trust with customers, partners, and institutions.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Execution Excellence</h4>
                <p className="text-muted-foreground text-sm">
                  Backed by years of national infrastructure deployment, we focus on timely installation, 
                  regulatory compliance, and operational reliability.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Leaf className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Sustainability First</h4>
                <p className="text-muted-foreground text-sm">
                  Every solar installation is a step toward reducing carbon emissions and protecting 
                  India's environmental future.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Partner Empowerment</h4>
                <p className="text-muted-foreground text-sm">
                  We believe in inclusive growth by enabling local partners, installers, and entrepreneurs 
                  to grow with us.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Home className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Nation Building</h4>
                <p className="text-muted-foreground text-sm">
                  From digital payments to renewable energy, our work is aligned with India's vision of 
                  self-reliance, energy security, and economic resilience.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Customer-Centric Approach</h4>
                <p className="text-muted-foreground text-sm">
                  We design solutions around household needs—simple processes, dependable systems, 
                  and long-term support.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Renewable Energy Introduction */}
      <section id="renewable-energy" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Why Renewable Energy?</h2>
              <p className="text-muted-foreground mb-6">
                India receives abundant sunlight throughout the year, making it ideal for solar power generation. 
                By harnessing this free, clean energy, you can significantly reduce your carbon footprint while 
                saving money on electricity bills.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Clean & Green</div>
                    <div className="text-sm text-muted-foreground">Zero emissions, sustainable power for your home</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Energy Independence</div>
                    <div className="text-sm text-muted-foreground">Generate your own electricity, reduce grid dependency</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Cost Savings</div>
                    <div className="text-sm text-muted-foreground">Reduce electricity bills by up to 90%</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Government Support</div>
                    <div className="text-sm text-muted-foreground">Attractive subsidies make solar affordable for everyone</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 text-center">
                  <Leaf className="w-10 h-10 text-primary mx-auto mb-3" />
                  <div className="font-semibold">Eco-Friendly</div>
                  <div className="text-sm text-muted-foreground">Reduce 3-4 tons CO2/year</div>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 text-center">
                  <IndianRupee className="w-10 h-10 text-primary mx-auto mb-3" />
                  <div className="font-semibold">Savings</div>
                  <div className="text-sm text-muted-foreground">Rs 10,000-20,000/year</div>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 text-center">
                  <Home className="w-10 h-10 text-primary mx-auto mb-3" />
                  <div className="font-semibold">Property Value</div>
                  <div className="text-sm text-muted-foreground">Increases home value</div>
                </CardContent>
              </Card>
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-10 h-10 text-primary mx-auto mb-3" />
                  <div className="font-semibold">Net Metering</div>
                  <div className="text-sm text-muted-foreground">Sell excess power</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* PM Surya Ghar Yojana Section */}
      <section id="pm-surya-ghar" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Sun className="w-4 h-4" />
              Government of India Initiative
            </div>
            <h2 className="text-3xl font-bold mb-4">PM Surya Ghar Muft Bijli Yojana</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              A flagship scheme by the Government of India to provide free electricity to 1 crore households 
              through rooftop solar installations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-xl mb-4">Subsidy Structure</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>Up to 2 kW</span>
                    <span className="font-semibold text-primary">Rs 30,000/kW</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span>2-3 kW (additional)</span>
                    <span className="font-semibold text-primary">Rs 18,000/kW</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span>Maximum (3 kW)</span>
                    <span className="font-semibold text-primary">Rs 78,000</span>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-primary/10 rounded-lg text-sm">
                  <strong>Note:</strong> Additional state subsidies available in Odisha (+Rs 20,000/kW) and 
                  Uttar Pradesh (+Rs 10,000/kW)
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-xl mb-4">Eligibility Criteria</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <span>Indian citizen with valid electricity connection</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <span>Own a house with suitable rooftop space</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <span>Residential electricity consumer</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <span>DCR-compliant solar panels mandatory for subsidy</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <span>No previous solar subsidy availed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <WouterLink href="/subsidy-calculator">
              <Button size="lg" className="gap-2" data-testid="pmsghy-subsidy-button">
                <Calculator className="w-5 h-5" />
                Calculate Your Subsidy
              </Button>
            </WouterLink>
          </div>
        </div>
      </section>

      {/* Steps to Apply */}
      <section id="steps" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Steps to Apply for PM Surya Ghar Yojana</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our streamlined process makes it easy to get solar panels installed on your rooftop
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { step: 1, title: "Register Online", desc: "Visit the PM Surya Ghar portal or contact our partner to register your application" },
              { step: 2, title: "Submit Documents", desc: "Provide electricity bill, Aadhaar, bank details, and property documents" },
              { step: 3, title: "Site Survey", desc: "Our technical team visits your home to assess rooftop suitability" },
              { step: 4, title: "DISCOM Approval", desc: "Your local electricity board approves the net metering connection" },
              { step: 5, title: "Installation", desc: "Professional installation by certified technicians (1-2 days)" },
              { step: 6, title: "Get Subsidy", desc: "Subsidy directly credited to your bank account after inspection" },
            ].map((item) => (
              <Card key={item.step}>
                <CardContent className="p-6">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SunPunch Inverter Section */}
      <section id="sunpunch" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Recommended Technology
            </div>
            <h2 className="text-3xl font-bold mb-4">SunPunch Trimax 3-in-1 Inverter</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              India's only On-Grid + Off-Grid + Hybrid inverter by Statcon Powertech. 
              The most versatile solar inverter for your home.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="bg-card" data-testid="card-sunpunch-functionality">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Battery className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium">3-in-1 Functionality</div>
                      <div className="text-sm text-muted-foreground">On-Grid, Off-Grid & Hybrid modes</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card" data-testid="card-sunpunch-wifi">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Wifi className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium">WiFi Monitoring</div>
                      <div className="text-sm text-muted-foreground">Remote monitoring via app</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card" data-testid="card-sunpunch-backflow">
                  <CardContent className="p-4 flex items-start gap-3">
                    <Shield className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium">Backflow Prevention</div>
                      <div className="text-sm text-muted-foreground">Safe grid-tie operation</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card" data-testid="card-sunpunch-efficiency">
                  <CardContent className="p-4 flex items-start gap-3">
                    <TrendingUp className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-medium">99% MPPT Efficiency</div>
                      <div className="text-sm text-muted-foreground">Maximum power harvest</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-xl mb-6">Why Choose SunPunch Trimax?</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Power Backup During Outages</div>
                      <div className="text-sm text-muted-foreground">
                        Unlike standard on-grid inverters, Trimax provides backup power when the grid goes down
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Parallel Operation</div>
                      <div className="text-sm text-muted-foreground">
                        Connect up to 12 units in parallel for larger installations
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">High PV Input</div>
                      <div className="text-sm text-muted-foreground">
                        Supports up to 500Vdc PV input for flexible panel configurations
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Made in India</div>
                      <div className="text-sm text-muted-foreground">
                        Manufactured by Statcon Powertech, a trusted Indian company
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                  <div className="text-sm font-medium mb-2">Available Models:</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-background px-3 py-1 rounded-md text-sm">3.5 kW</span>
                    <span className="bg-background px-3 py-1 rounded-md text-sm">5.5 kW</span>
                    <span className="bg-background px-3 py-1 rounded-md text-sm">6.2 kW</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* State-wise Progress Section */}
      <section id="state-progress" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <BarChart3 className="w-4 h-4" />
              Our Working States
            </div>
            <h2 className="text-3xl font-bold mb-4">State-wise Progress Under PM Surya Ghar Yojana</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              DivyanshiSolar is actively partnering across four key states in India. 
              See our installation progress and reach.
            </p>
          </div>

          {/* National Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-primary" data-testid="text-national-applications">54,45,589</div>
                <div className="text-xs text-muted-foreground">Applications (India)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-primary" data-testid="text-national-installations">20,12,203</div>
                <div className="text-xs text-muted-foreground">Installations</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-primary" data-testid="text-national-households">25,12,142</div>
                <div className="text-xs text-muted-foreground">Households Covered</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-primary" data-testid="text-national-capacity">7,442.81 MW</div>
                <div className="text-xs text-muted-foreground">Capacity Installed</div>
              </CardContent>
            </Card>
            <Card className="col-span-2 lg:col-span-1">
              <CardContent className="p-4 text-center">
                <div className="text-xl font-bold text-primary" data-testid="text-national-subsidy">Rs 14,361.31 Cr</div>
                <div className="text-xs text-muted-foreground">Subsidy Released</div>
              </CardContent>
            </Card>
          </div>

          {/* State Tabs */}
          <Tabs defaultValue="bihar" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-2 bg-transparent p-0">
              <TabsTrigger 
                value="bihar" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
                data-testid="tab-bihar"
              >
                <MapPin className="w-4 h-4" />
                Bihar
              </TabsTrigger>
              <TabsTrigger 
                value="jharkhand" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
                data-testid="tab-jharkhand"
              >
                <MapPin className="w-4 h-4" />
                Jharkhand
              </TabsTrigger>
              <TabsTrigger 
                value="uttar-pradesh" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
                data-testid="tab-up"
              >
                <MapPin className="w-4 h-4" />
                Uttar Pradesh
              </TabsTrigger>
              <TabsTrigger 
                value="odisha" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border"
                data-testid="tab-odisha"
              >
                <MapPin className="w-4 h-4" />
                Odisha
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bihar" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl">Bihar</h3>
                      <p className="text-sm text-muted-foreground">Active Partner Network</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-xl font-bold" data-testid="text-bihar-applications">54,075</div>
                      <div className="text-xs text-muted-foreground">Applications</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-xl font-bold" data-testid="text-bihar-installations">13,953</div>
                      <div className="text-xs text-muted-foreground">Installations</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-xl font-bold" data-testid="text-bihar-households">14,601</div>
                      <div className="text-xs text-muted-foreground">Households Covered</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-xl font-bold" data-testid="text-bihar-capacity">50.14 MW</div>
                      <div className="text-xs text-muted-foreground">Capacity Installed</div>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg text-center col-span-2 lg:col-span-1">
                      <div className="text-xl font-bold text-primary" data-testid="text-bihar-subsidy">Rs 99.33 Cr</div>
                      <div className="text-xs text-muted-foreground">Subsidy Released</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Bihar is making strong progress under PM Surya Ghar Yojana with over 54,000 applications and nearly 14,000 installations completed. 
                    Our partner network covers major districts including Patna, Gaya, Bhagalpur, and Muzaffarpur.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="jharkhand" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl">Jharkhand</h3>
                      <p className="text-sm text-muted-foreground">Growing Partner Network</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-xl font-bold" data-testid="text-jharkhand-applications">7,553</div>
                      <div className="text-xs text-muted-foreground">Applications</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-xl font-bold" data-testid="text-jharkhand-installations">1,372</div>
                      <div className="text-xs text-muted-foreground">Installations</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-xl font-bold" data-testid="text-jharkhand-households">1,374</div>
                      <div className="text-xs text-muted-foreground">Households Covered</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-xl font-bold" data-testid="text-jharkhand-capacity">5.49 MW</div>
                      <div className="text-xs text-muted-foreground">Capacity Installed</div>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg text-center col-span-2 lg:col-span-1">
                      <div className="text-xl font-bold text-primary" data-testid="text-jharkhand-subsidy">Rs 9.32 Cr</div>
                      <div className="text-xs text-muted-foreground">Subsidy Released</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Jharkhand is steadily growing under PM Surya Ghar Yojana with over 7,500 applications and 1,372 installations completed. 
                    Our network is expanding in Ranchi, Jamshedpur, Dhanbad, and Bokaro regions.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="uttar-pradesh" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl">Uttar Pradesh</h3>
                      <p className="text-sm text-muted-foreground">Highest Target State (+Rs 10,000/kW Additional Subsidy)</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-xl font-bold" data-testid="text-up-applications">10,06,682</div>
                      <div className="text-xs text-muted-foreground">Applications</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-xl font-bold" data-testid="text-up-installations">3,12,953</div>
                      <div className="text-xs text-muted-foreground">Installations</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-xl font-bold" data-testid="text-up-households">3,16,267</div>
                      <div className="text-xs text-muted-foreground">Households Covered</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-xl font-bold" data-testid="text-up-capacity">1,078.93 MW</div>
                      <div className="text-xs text-muted-foreground">Capacity Installed</div>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg text-center col-span-2 lg:col-span-1">
                      <div className="text-xl font-bold text-primary" data-testid="text-up-subsidy">Rs 2,162.79 Cr</div>
                      <div className="text-xs text-muted-foreground">Subsidy Released</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Uttar Pradesh leads with over 10 lakh applications and 3.12 lakh installations. The state offers an additional 
                    Rs 10,000/kW subsidy. We operate across Lucknow, Varanasi, Agra, Kanpur, and more.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="odisha" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl">Odisha</h3>
                      <p className="text-sm text-muted-foreground">Best State Subsidy (+Rs 20,000/kW Additional Subsidy)</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-xl font-bold" data-testid="text-odisha-applications">1,50,935</div>
                      <div className="text-xs text-muted-foreground">Applications</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-xl font-bold" data-testid="text-odisha-installations">25,544</div>
                      <div className="text-xs text-muted-foreground">Installations</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-xl font-bold" data-testid="text-odisha-households">25,892</div>
                      <div className="text-xs text-muted-foreground">Households Covered</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-xl font-bold" data-testid="text-odisha-capacity">83.1 MW</div>
                      <div className="text-xs text-muted-foreground">Capacity Installed</div>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg text-center col-span-2 lg:col-span-1">
                      <div className="text-xl font-bold text-primary" data-testid="text-odisha-subsidy">Rs 158.07 Cr</div>
                      <div className="text-xs text-muted-foreground">Subsidy Released</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Odisha has 1.5 lakh applications with 25,544 installations completed. The state offers the highest additional 
                    subsidy of Rs 20,000/kW. Our network covers Bhubaneswar, Cuttack, Rourkela, and Puri.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Data sourced from PM Surya Ghar portal (pmsuryaghar.gov.in). Last updated: December 2024.
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
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Go Solar?</h2>
          <p className="text-lg opacity-90 mb-8">
            Join thousands of households already benefiting from free solar electricity. 
            Calculate your subsidy or become a partner today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <WouterLink href="/subsidy-calculator">
              <Button size="lg" variant="secondary" className="gap-2 w-full sm:w-auto" data-testid="cta-subsidy-button">
                <Calculator className="w-5 h-5" />
                Check Your Subsidy
              </Button>
            </WouterLink>
            <WouterLink href="/register">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" data-testid="cta-partner-button">
                <Users className="w-5 h-5" />
                Join Partner Network
              </Button>
            </WouterLink>
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get in touch with our team for solar installation inquiries or partnership opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MapPinned className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Office Address</h3>
                <p className="text-muted-foreground text-sm">
                  PIPARWAN, PANCHAYAT-JAITIPUR,<br />
                  NAUBATPUR, PATNA 800014
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Chandrakant Akela</h3>
                <p className="text-muted-foreground text-sm">
                  <a href="tel:9801005212" className="hover:text-primary">9801005212</a><br />
                  <a href="tel:8709127232" className="hover:text-primary">8709127232</a>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <a href="mailto:chandrakant@divyanshisolar.com" className="hover:text-primary">chandrakant@divyanshisolar.com</a>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Anil</h3>
                <p className="text-muted-foreground text-sm">
                  <a href="tel:9123141987" className="hover:text-primary">9123141987</a>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <a href="mailto:anil@divyanshisolar.com" className="hover:text-primary">anil@divyanshisolar.com</a>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Sanjay</h3>
                <p className="text-muted-foreground text-sm">
                  <a href="tel:8777684575" className="hover:text-primary">8777684575</a>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  <a href="mailto:sanjay@divyanshisolar.com" className="hover:text-primary">sanjay@divyanshisolar.com</a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="mb-4">
                <img 
                  src={logoImage} 
                  alt="Divyanshi Solar" 
                  className="h-12 w-auto object-contain"
                />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                A brand of Divyanshi Digital Services Pvt. Ltd.<br />
                Authorized Partner Network for PM Surya Ghar Yojana
              </p>
              <p className="text-xs text-muted-foreground">
                CIN: U93090BR2017PTC036522
              </p>
              <p className="text-xs text-muted-foreground">
                GST: 10AAGCD4586K1ZK
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <div className="flex flex-col gap-2">
                <WouterLink href="/subsidy-calculator" className="text-sm text-muted-foreground hover:text-foreground">
                  Subsidy Calculator
                </WouterLink>
                <WouterLink href="/network-map" className="text-sm text-muted-foreground hover:text-foreground">
                  Partner Network Map
                </WouterLink>
                <WouterLink href="/vendor-registration" className="text-sm text-muted-foreground hover:text-foreground">
                  Vendor Registration
                </WouterLink>
                <WouterLink href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                  Partner Login
                </WouterLink>
                <WouterLink href="/register" className="text-sm text-muted-foreground hover:text-foreground">
                  Join Network
                </WouterLink>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <div className="flex flex-col gap-2">
                <WouterLink href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground">
                  Privacy Policy
                </WouterLink>
                <WouterLink href="/disclaimer" className="text-sm text-muted-foreground hover:text-foreground">
                  Disclaimer
                </WouterLink>
                <WouterLink href="/terms-and-conditions" className="text-sm text-muted-foreground hover:text-foreground">
                  Terms and Conditions
                </WouterLink>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="flex justify-center gap-4 mb-8">
            <a 
              href="https://www.linkedin.com/in/chandrakant-akela-a1479a18" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              data-testid="link-linkedin"
            >
              <SiLinkedin className="w-5 h-5" />
            </a>
            <a 
              href="https://x.com/chandu532" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              data-testid="link-twitter"
            >
              <SiX className="w-5 h-5" />
            </a>
            <a 
              href="https://www.facebook.com/nayabharatdivyanshi" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              data-testid="link-facebook"
            >
              <SiFacebook className="w-5 h-5" />
            </a>
            <a 
              href="https://www.instagram.com/chandu532/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              data-testid="link-instagram"
            >
              <SiInstagram className="w-5 h-5" />
            </a>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              2024 Divyanshi Digital Services Pvt. Ltd. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Powering India with Solar Energy</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Feedback Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <FeedbackDialog
          isPublic={true}
          trigger={
            <Button size="lg" className="gap-2 shadow-lg" data-testid="button-floating-feedback">
              <MessageSquare className="w-5 h-5" />
              <span className="hidden sm:inline">Feedback</span>
            </Button>
          }
        />
      </div>
    </div>
  );
}
