import { Link } from "wouter";
import { ArrowLeft, Sun, Shield, Award, CheckCircle2, Zap, ThermometerSun, Wind, CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import logoImage from "@assets/88720521_logo_1766219255006.png";
import omegaSeriesImage from "@assets/Omega-Series-IB-Solar-01-11-2026_12_54_AM_1768075180244.png";
import optimaSeriesImage from "@assets/Optima-G12R-Bifacial-Solar-Panels-–-595-Wp-IB-Solar-01-11-2026_1768075180244.png";
import orion132Image from "@assets/Orion-Series-132-Cells-IB-Solar-01-11-2026_12_56_AM_1768075180245.png";
import orion144Image from "@assets/Orion-Series-144-Cells-IB-Solar-01-11-2026_12_36_AM_1768075180245.png";
import performerSeriesImage from "@assets/Performer-Series-Bifacial-DCR-Solar-Panels-IB-Solar-01-11-2026_1768075180246.png";

const panelSeries = [
  {
    id: "omega",
    name: "Omega Series",
    technology: "N-TOPCon",
    tagline: "Advanced N-Type TOPCon Bifacial Solar Modules for Maximum Energy Output",
    image: omegaSeriesImage,
    cellOptions: ["144 Cells: 550-600 Wp", "156 Cells: 605-640 Wp"],
    efficiency: "Up to 23.21%",
    features: [
      "N-Type TOPCon technology for superior efficiency",
      "16 Busbar (16BB) design for improved energy capture",
      "Bifacial modules for dual-sided energy generation",
      "Excellent performance in low light and high temperature",
      "Premium reliability and long-term value",
    ],
    badge: "Premium",
    badgeColor: "bg-amber-500",
  },
  {
    id: "optima",
    name: "Optima Series - G12R",
    technology: "N-TOPCon",
    tagline: "High-Power N-Type TOPCon Modules Built on G12R Platform for Maximum Output",
    image: optimaSeriesImage,
    cellOptions: ["595-625 Wp"],
    efficiency: "High Efficiency",
    features: [
      "Cutting-edge N-TOPCon technology",
      "Larger G12R wafer size format",
      "Optimized for utility-scale installations",
      "High-output commercial applications",
      "Excellent temperature performance",
      "Long-term reliability",
    ],
    badge: "Commercial",
    badgeColor: "bg-blue-500",
  },
  {
    id: "orion-132",
    name: "Orion Series - 132 Cells",
    technology: "Mono PERC",
    tagline: "High-Efficiency Half-Cut Mono PERC Panels with Industry-Leading Durability",
    image: orion132Image,
    cellOptions: ["Up to 475-500 Wp", "Mono-Facial & Bi-Facial"],
    efficiency: "High Power Output",
    features: [
      "Advanced Mono PERC half-cut cell technology",
      "High power output and long-term stability",
      "Optimized temperature performance",
      "Multi-busbar architecture",
      "Non-destructive cutting technology",
      "Ideal for commercial, utility, and rooftop applications",
    ],
    badge: "Popular",
    badgeColor: "bg-green-500",
  },
  {
    id: "orion-144",
    name: "Orion Series - 144 Cells",
    technology: "Mono PERC",
    tagline: "Robust High-Wattage Mono PERC Half-Cut Modules for Large-Scale Solar Projects",
    image: orion144Image,
    cellOptions: ["Up to 520-550 Wp", "Mono-Facial & Bi-Facial"],
    efficiency: "High Wattage",
    features: [
      "High-output M10 Mono PERC half-cut cells",
      "Increased reliability and excellent performance",
      "Strong efficiency in low-light conditions",
      "Rugged frame and high load tolerance",
      "Optimized for utility-scale and industrial deployments",
    ],
    badge: "Industrial",
    badgeColor: "bg-purple-500",
  },
  {
    id: "performer",
    name: "Performer Series - DCR Bifacial",
    technology: "Mono PERC (DCR)",
    tagline: "High-Efficiency Mono PERC Half-Cut Solar PV Modules with Enhanced Durability",
    image: performerSeriesImage,
    cellOptions: ["120 Cells: 430-455 Wp", "Mono-Facial & Bi-Facial"],
    efficiency: "DCR Compliant",
    features: [
      "Designed for maximum power output and reliability",
      "Long-term durability with advanced Mono PERC cells",
      "Multi-busbar technology for superior performance",
      "Excellent low-light performance",
      "Non-destructive cell cutting and bifacial compatibility",
      "Ideal for large-scale and commercial rooftop projects",
    ],
    badge: "DCR",
    badgeColor: "bg-orange-500",
  },
];

const warrantyItems = [
  {
    icon: Shield,
    title: "10 Years Product Warranty",
    description: "Covers materials and workmanship",
  },
  {
    icon: Award,
    title: "27 Years Linear Performance Warranty",
    description: "1st Year: 98% Output | 27th Year: 83.7% Output",
  },
];

const certifications = [
  "IS 14286:2010",
  "IEC 61215:2005 IS",
  "IEC 61730-1 & 61730-2:2004 IS",
  "IEC 62804, IEC 61853, IEC 61701",
];

const technicalHighlights = [
  {
    icon: Zap,
    title: "Multi-busbar Technology",
    description: "Minimizes electrical losses for maximum efficiency",
  },
  {
    icon: ThermometerSun,
    title: "Excellent Temperature Coefficient",
    description: "Performance: \u03b4 = -0.2111%/\u00b0C",
  },
  {
    icon: Wind,
    title: "High Load Tolerance",
    description: "5400 Pa front and 2400 Pa rear mechanical load",
  },
  {
    icon: CheckCircle2,
    title: "Hailstone Tested",
    description: "Certified at 25mm at 23m/s impact resistance",
  },
];

export default function IBSolarPanelsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/">
            <img 
              src={logoImage} 
              alt="Divyanshi Solar" 
              className="h-10 w-auto object-contain cursor-pointer"
            />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="button-back-home">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16 md:py-24">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <Badge className="mb-4 bg-primary/20 text-primary hover:bg-primary/30">
                <Sun className="mr-1 h-3 w-3" />
                Official IB Solar Partner
              </Badge>
              <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                IB Solar Panels
              </h1>
              <p className="mb-8 text-lg text-muted-foreground md:text-xl">
                Premium quality solar panels from IB Energy - Switch to Solar for a Brighter Tomorrow.
                Featuring advanced N-TOPCon and Mono PERC technologies with industry-leading efficiency and reliability.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/subsidy-calculator">
                  <Button size="lg" data-testid="button-calculate-savings">
                    Calculate Your Savings
                  </Button>
                </Link>
                <Link href="/customer-registration">
                  <Button variant="outline" size="lg" data-testid="button-get-quote">
                    Get a Free Quote
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Panel Series</h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Explore our comprehensive range of IB Solar panels designed for residential, commercial, and industrial applications.
              </p>
            </div>

            <div className="space-y-12">
              {panelSeries.map((panel, index) => (
                <Card key={panel.id} className="overflow-hidden" data-testid={`card-panel-${panel.id}`}>
                  <div className={`flex flex-col ${index % 2 === 1 ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
                    <div className="relative flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-8 lg:w-2/5">
                      <div className="absolute inset-0 opacity-30">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
                      </div>
                      <img 
                        src={panel.image} 
                        alt={panel.name}
                        className="relative z-10 h-auto max-h-80 w-auto max-w-full object-contain drop-shadow-2xl"
                      />
                    </div>
                    <div className="flex-1 p-6 lg:p-8">
                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        <Badge className={`${panel.badgeColor} text-white`}>
                          {panel.badge}
                        </Badge>
                        <Badge variant="outline">{panel.technology}</Badge>
                      </div>
                      <h3 className="mb-2 text-2xl font-bold lg:text-3xl">{panel.name}</h3>
                      <p className="mb-4 text-muted-foreground">{panel.tagline}</p>
                      
                      <div className="mb-6 flex flex-wrap gap-2">
                        {panel.cellOptions.map((option, i) => (
                          <Badge key={i} variant="secondary" className="text-sm">
                            {option}
                          </Badge>
                        ))}
                        <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                          {panel.efficiency}
                        </Badge>
                      </div>

                      <div className="mb-6">
                        <h4 className="mb-3 font-semibold">Key Features</h4>
                        <ul className="grid gap-2 md:grid-cols-2">
                          {panel.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Link href="/customer-registration">
                          <Button data-testid={`button-enquire-${panel.id}`}>
                            Request Quote
                          </Button>
                        </Link>
                        <Link href="/subsidy-calculator">
                          <Button variant="outline" data-testid={`button-calculate-${panel.id}`}>
                            Calculate Savings
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t bg-muted/30 py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Technical Highlights</h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Built with cutting-edge technology for maximum performance and durability
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {technicalHighlights.map((highlight, index) => (
                <Card key={index} className="text-center" data-testid={`card-highlight-${index}`}>
                  <CardHeader>
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <highlight.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{highlight.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{highlight.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Warranty & Certifications</h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                Industry-leading warranty coverage and internationally recognized certifications
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="grid gap-4">
                {warrantyItems.map((item, index) => (
                  <Card key={index} data-testid={`card-warranty-${index}`}>
                    <CardContent className="flex items-center gap-4 p-6">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                        <item.icon className="h-7 w-7 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{item.title}</h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="grid gap-4">
                <Card data-testid="card-certifications">
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                      <Award className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold">Certifications</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {certifications.map((cert, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-green-500" />
                            {cert}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-mnre">
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                      <Shield className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold">MNRE-Approved</h3>
                      <p className="text-sm text-muted-foreground">
                        Listed in the ALMM and meets Government of India compliance standards
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t bg-primary py-16 text-primary-foreground md:py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Ready to Go Solar?</h2>
            <p className="mx-auto mb-8 max-w-2xl opacity-90">
              Get in touch with us today to learn more about IB Solar panels and how they can power your home or business with clean, renewable energy.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/customer-registration">
                <Button size="lg" variant="secondary" data-testid="button-cta-register">
                  Register for Free Consultation
                </Button>
              </Link>
              <Link href="/subsidy-calculator">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" data-testid="button-cta-calculator">
                  Calculate Subsidy & Savings
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>IB Solar panels are manufactured by IB Energy (IB Group) - India's leading solar panel manufacturer.</p>
          <p className="mt-2">Divyanshi Solar is an authorized distributor and installation partner.</p>
        </div>
      </footer>
    </div>
  );
}
