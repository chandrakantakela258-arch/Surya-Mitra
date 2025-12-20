import { Link as WouterLink } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/theme-toggle";
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
  Wifi,
  Shield,
  TrendingUp,
  Menu,
  X,
  MapPin,
  BarChart3
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
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Sun className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl hidden sm:block">DivyanshiSolar</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <button 
                onClick={() => scrollToSection("about")} 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-about"
              >
                About Us
              </button>
              <button 
                onClick={() => scrollToSection("renewable-energy")} 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-renewable"
              >
                Renewable Energy
              </button>
              <button 
                onClick={() => scrollToSection("pm-surya-ghar")} 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-pmsghy"
              >
                PM Surya Ghar Yojana
              </button>
              <button 
                onClick={() => scrollToSection("steps")} 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-steps"
              >
                Steps to Apply
              </button>
              <button 
                onClick={() => scrollToSection("sunpunch")} 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-sunpunch"
              >
                SunPunch Inverter
              </button>
              <button 
                onClick={() => scrollToSection("state-progress")} 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                data-testid="nav-state-progress"
              >
                State Progress
              </button>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <WouterLink href="/subsidy-calculator">
                <Button variant="outline" size="sm" className="hidden sm:flex gap-2" data-testid="button-subsidy-calculator">
                  <Calculator className="w-4 h-4" />
                  Subsidy Calculator
                </Button>
              </WouterLink>
              <WouterLink href="/login">
                <Button variant="ghost" size="sm" data-testid="button-login">
                  Login
                </Button>
              </WouterLink>
              <WouterLink href="/register">
                <Button size="sm" data-testid="button-join-network">
                  Join Our Network
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
            <nav className="lg:hidden py-4 border-t flex flex-col gap-2">
              <button 
                onClick={() => scrollToSection("about")} 
                className="text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                data-testid="mobile-nav-about"
              >
                About Us
              </button>
              <button 
                onClick={() => scrollToSection("renewable-energy")} 
                className="text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                data-testid="mobile-nav-renewable"
              >
                Renewable Energy
              </button>
              <button 
                onClick={() => scrollToSection("pm-surya-ghar")} 
                className="text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                data-testid="mobile-nav-pmsghy"
              >
                PM Surya Ghar Yojana
              </button>
              <button 
                onClick={() => scrollToSection("steps")} 
                className="text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                data-testid="mobile-nav-steps"
              >
                Steps to Apply
              </button>
              <button 
                onClick={() => scrollToSection("sunpunch")} 
                className="text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                data-testid="mobile-nav-sunpunch"
              >
                SunPunch Inverter
              </button>
              <button 
                onClick={() => scrollToSection("state-progress")} 
                className="text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                data-testid="mobile-nav-state-progress"
              >
                State Progress
              </button>
              <WouterLink href="/subsidy-calculator">
                <Button variant="outline" size="sm" className="w-full mt-2 gap-2" data-testid="mobile-nav-subsidy">
                  <Calculator className="w-4 h-4" />
                  Subsidy Calculator
                </Button>
              </WouterLink>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
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

      {/* About Us Section */}
      <section id="about" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">About DivyanshiSolar</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We are an authorized partner network for PM Surya Ghar Yojana, helping Indian households 
              transition to clean, affordable solar energy.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Partner Network</h3>
                <p className="text-muted-foreground">
                  Our network of Business Development Partners (BDP) and District Development Partners (DDP) 
                  ensures quality installations across India.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Quality Assurance</h3>
                <p className="text-muted-foreground">
                  We use only DCR-compliant (Domestic Content Requirement) solar panels, 
                  ensuring Made in India quality with government subsidy eligibility.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">End-to-End Support</h3>
                <p className="text-muted-foreground">
                  From application to installation and subsidy claim, we handle everything 
                  for a hassle-free solar journey.
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary" data-testid="text-national-installations">19.45 Lakh+</div>
                <div className="text-sm text-muted-foreground">Systems Installed (India)</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary" data-testid="text-national-budget">Rs 75,021 Cr</div>
                <div className="text-sm text-muted-foreground">Total Budget</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary" data-testid="text-national-disbursed">Rs 13,926 Cr</div>
                <div className="text-sm text-muted-foreground">Subsidy Disbursed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-primary" data-testid="text-national-zero-bills">7.71 Lakh</div>
                <div className="text-sm text-muted-foreground">Zero Bill Households</div>
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
                  <div className="grid sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold" data-testid="text-jharkhand-registrations">2+ Lakh</div>
                      <div className="text-sm text-muted-foreground">Registrations</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold" data-testid="text-jharkhand-status">Active</div>
                      <div className="text-sm text-muted-foreground">Program Status</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold" data-testid="text-jharkhand-subsidy">Standard</div>
                      <div className="text-sm text-muted-foreground">State Subsidy</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Jharkhand is rapidly adopting rooftop solar under the scheme. 
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
                      <p className="text-sm text-muted-foreground">Highest Target State</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold" data-testid="text-up-registrations">5+ Lakh</div>
                      <div className="text-sm text-muted-foreground">Registrations</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold" data-testid="text-up-target">25 Lakh</div>
                      <div className="text-sm text-muted-foreground">State Target</div>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg text-center border-2 border-primary/30">
                      <div className="text-2xl font-bold text-primary" data-testid="text-up-subsidy">+Rs 10,000/kW</div>
                      <div className="text-sm text-muted-foreground">Additional Subsidy</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Uttar Pradesh has the highest target of 25 lakh households and offers an additional 
                    Rs 10,000/kW state subsidy. We operate across Lucknow, Varanasi, Agra, Kanpur, and more.
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
                      <p className="text-sm text-muted-foreground">Best State Subsidy</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold" data-testid="text-odisha-registrations">5+ Lakh</div>
                      <div className="text-sm text-muted-foreground">Registrations</div>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-center">
                      <div className="text-2xl font-bold" data-testid="text-odisha-status">Active</div>
                      <div className="text-sm text-muted-foreground">Program Status</div>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg text-center border-2 border-primary/30">
                      <div className="text-2xl font-bold text-primary" data-testid="text-odisha-subsidy">+Rs 20,000/kW</div>
                      <div className="text-sm text-muted-foreground">Additional Subsidy</div>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    Odisha offers the highest additional state subsidy of Rs 20,000/kW, making solar 
                    even more affordable. Our network covers Bhubaneswar, Cuttack, Rourkela, and Puri.
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

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Sun className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold">DivyanshiSolar</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Authorized Partner Network for PM Surya Ghar Yojana
            </div>
            <div className="flex items-center gap-4">
              <WouterLink href="/login" className="text-sm text-muted-foreground hover:text-foreground">
                Partner Login
              </WouterLink>
              <WouterLink href="/register" className="text-sm text-muted-foreground hover:text-foreground">
                Join Network
              </WouterLink>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
