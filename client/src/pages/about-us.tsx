import { Link as WouterLink } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sun, ArrowLeft, Users, Target, Award, MapPin, Phone, Mail, Building2, Zap, CheckCircle } from "lucide-react";

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <WouterLink href="/">
              <div className="flex items-center gap-2 cursor-pointer">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Sun className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl hidden sm:block">Divyanshi Solar</span>
              </div>
            </WouterLink>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <WouterLink href="/">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </WouterLink>

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl p-8 mb-8 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Sun className="w-10 h-10 text-yellow-300" />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Divyanshi Solar™</h1>
              <p className="text-orange-100 font-medium">Powering Every Home</p>
            </div>
          </div>
          <p className="text-lg font-semibold mt-3">A Brand of Divyanshi Digital Services Pvt. Ltd.</p>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-medium">✅ Registered SBPDCL Vendor</span>
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-medium">✅ Registered NBPDCL Vendor</span>
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-medium">✅ Authorised Livguard Distributor</span>
            <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-full text-sm font-medium">☀️ PM-Surya Ghar: Muft Bijli Yojana</span>
          </div>
        </div>

        <Card>
          <CardContent className="p-8 space-y-10">

            {/* About */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold">About Divyanshi Digital Services Pvt Ltd</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                <strong className="text-foreground">Divyanshi Digital Services Pvt. Ltd.</strong> is a Registered SBPDCL &amp; NBPDCL vendor
                under <strong className="text-foreground">PM-Surya Ghar: Muft Bijli Yojana Rooftop Solar Program</strong>, committed to helping
                Indian households transition to clean, reliable, and affordable solar energy.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Divyanshi Solar™</strong> is the consumer-facing brand of Divyanshi Digital Services Pvt. Ltd.,
                dedicated to making rooftop solar accessible to every home across India — with end-to-end support from
                site survey to subsidy disbursement.
              </p>
            </section>

            {/* Our Legacy */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold">Our Legacy</h2>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3 text-muted-foreground">
                <p className="leading-relaxed">
                  Divyanshi Digital Services Pvt. Ltd. was incorporated on <strong className="text-foreground">11th December 2017</strong>,
                  with a strong legacy of executing large-scale, technology-driven infrastructure projects across India.
                </p>
                <p className="leading-relaxed">
                  For the last <strong className="text-foreground">8+ years</strong>, we have been closely associated with
                  <strong className="text-foreground"> Hitachi Payment Services Pvt. Ltd.</strong>, delivering mission-critical
                  financial infrastructure — building the expertise, discipline, and scale required to serve millions of
                  households across India.
                </p>
                <p className="leading-relaxed">
                  That same commitment to reliability, quality, and technology now drives our solar mission — helping
                  every Indian family harness the power of the sun.
                </p>
              </div>
            </section>

            {/* Mission */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold">Our Mission</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To empower every Indian household with clean, renewable solar energy by simplifying the process
                of availing government subsidies under PM-Surya Ghar: Muft Bijli Yojana. We aim to reduce
                electricity bills, promote sustainable living, and contribute to India's green energy future.
              </p>
            </section>

            {/* Vision */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold">Our Vision</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To become India's most trusted rooftop solar brand — enabling 1 crore households to adopt clean
                solar energy by 2030 under PM-Surya Ghar: Muft Bijli Yojana and beyond.
              </p>
            </section>

            {/* Why Choose Us */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold">Why Choose Divyanshi Solar?</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  ["Registered SBPDCL & NBPDCL Vendor", "Official government-registered solar vendor in Bihar"],
                  ["PM-Surya Ghar Empanelled", "Authorised under India's flagship rooftop solar scheme"],
                  ["Authorised Livguard Distributor", "Premium solar panels, inverters & batteries at best prices"],
                  ["End-to-End Service", "From site survey to installation to subsidy claim — we handle everything"],
                  ["Transparent Pricing", "No hidden charges; clear quotations with detailed breakdowns"],
                  ["DCR-Certified Solar Panels", "BIS-certified Domestic Content Requirement compliant products"],
                  ["8+ Years of Infrastructure Legacy", "Backed by proven expertise with Hitachi Payment Services"],
                  ["Subsidy Assistance up to ₹78,000", "Complete guidance for availing maximum government subsidy"],
                ].map(([title, desc]) => (
                  <div key={title} className="flex gap-3 p-3 bg-muted/40 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Company Details */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Company Details</h2>
              <div className="bg-muted/50 rounded-xl p-5 grid sm:grid-cols-2 gap-3 text-sm">
                {[
                  ["Company Name", "Divyanshi Digital Services Pvt. Ltd."],
                  ["Brand", "Divyanshi Solar™ — Powering Every Home"],
                  ["CIN", "U93090BR2017PTC036522"],
                  ["GSTIN", "10AAGCD4586K1ZK"],
                  ["Incorporated", "11th December 2017"],
                  ["Registrations", "Registered SBPDCL & NBPDCL Vendor"],
                  ["Scheme", "PM-Surya Ghar: Muft Bijli Yojana"],
                  ["Distribution", "Authorised Livguard Energy Technologies Distributor"],
                ].map(([label, value]) => (
                  <div key={label} className="flex gap-2">
                    <span className="text-muted-foreground min-w-[110px] font-medium">{label}:</span>
                    <span className="font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-muted/40 rounded-xl">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground mb-1">Offices</p>
                    <p><strong>Head Office (Jaipur):</strong> Plot No. C-3/258, Flat No. G-2, Room-1, Shreyansh Apartment, Chitrakoot Scheme, Vaishali Nagar, Jaipur, Rajasthan 302021</p>
                    <p className="mt-1"><strong>Branch Office (Bihar):</strong> Bank of India Building, Naubatpur, Mashurhi Road, Vill-Piprawan, Block-Naubatpur, Patna, Bihar 801109</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { name: "Chandrakant Akela", phones: ["9801005212", "8709127232"], email: "chandrakant@divyanshisolar.in" },
                    { name: "Anil", phones: ["9123141987"], email: "anil@divyanshisolar.in" },
                    { name: "Sanjay", phones: ["8777684575"], email: "sanjay@divyanshisolar.in" },
                  ].map((c) => (
                    <div key={c.name} className="p-4 bg-muted/50 rounded-xl border">
                      <p className="font-semibold text-foreground mb-2">{c.name}</p>
                      {c.phones.map(p => (
                        <div key={p} className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Phone className="w-4 h-4" /><span>{p}</span>
                        </div>
                      ))}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" /><span>{c.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </CardContent>
        </Card>
      </main>

      <footer className="border-t mt-12 py-6 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} <strong>Divyanshi Digital Services Pvt. Ltd.</strong> — Divyanshi Solar™</p>
        <p className="mt-1">Registered SBPDCL &amp; NBPDCL Vendor | PM-Surya Ghar: Muft Bijli Yojana | Authorised Livguard Distributor</p>
        <p className="mt-1">divyanshisolar.in</p>
      </footer>
    </div>
  );
}
