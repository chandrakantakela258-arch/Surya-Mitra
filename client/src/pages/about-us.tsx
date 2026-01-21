import { Link as WouterLink } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sun, ArrowLeft, Users, Target, Award, MapPin, Phone, Mail } from "lucide-react";

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
          <Button variant="ghost" className="mb-6 gap-2" data-testid="button-back-home">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </WouterLink>

        <Card>
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold mb-6">About Us</h1>
            <p className="text-muted-foreground mb-4">
              <strong>Divyanshi Solar (Divyanshi Digital Services Pvt. Ltd.)</strong>
            </p>

            <div className="space-y-8 text-muted-foreground">
              {/* Company Overview */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Sun className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Who We Are</h2>
                </div>
                <p className="mb-4">
                  Divyanshi Solar is a leading authorized partner network for PM Surya Ghar Yojana, 
                  India's ambitious rooftop solar initiative. We are a brand of Divyanshi Digital Services Pvt. Ltd., 
                  committed to making solar energy accessible to every household across India.
                </p>
                <p>
                  With our extensive network of Business Development Partners (BDPs) and District Development Partners (DDPs), 
                  we ensure seamless solar installation services from application to commissioning.
                </p>
              </section>

              {/* Mission */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Our Mission</h2>
                </div>
                <p>
                  To empower every Indian household with clean, renewable solar energy by simplifying the 
                  process of availing government subsidies under PM Surya Ghar Yojana. We aim to reduce 
                  electricity bills, promote sustainable living, and contribute to India's green energy goals.
                </p>
              </section>

              {/* Vision */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Award className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Our Vision</h2>
                </div>
                <p>
                  To become India's most trusted solar installation partner network, enabling 1 crore 
                  households to adopt rooftop solar by 2030 under PM Surya Ghar Yojana.
                </p>
              </section>

              {/* Why Choose Us */}
              <section>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-orange-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground">Why Choose Divyanshi Solar?</h2>
                </div>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Authorized Partner Network:</strong> Official partner for PM Surya Ghar Yojana with authorized vendors</li>
                  <li><strong>End-to-End Service:</strong> From application to installation to subsidy claim - we handle everything</li>
                  <li><strong>Transparent Pricing:</strong> No hidden charges, clear quotations with detailed breakdowns</li>
                  <li><strong>Quality Products:</strong> We use only BIS-certified DCR (Domestic Content Requirement) solar panels</li>
                  <li><strong>Expert Installation:</strong> Trained and certified installation teams across India</li>
                  <li><strong>Post-Installation Support:</strong> Dedicated support for maintenance and warranty claims</li>
                  <li><strong>Government Subsidy Assistance:</strong> Complete help in availing up to Rs 78,000 subsidy</li>
                </ul>
              </section>

              {/* Company Details */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">Company Details</h2>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p><strong>Company Name:</strong> Divyanshi Digital Services Pvt. Ltd.</p>
                  <p><strong>Brand:</strong> Divyanshi Solar</p>
                  <p><strong>CIN:</strong> U93090BR2017PTC036522</p>
                  <p><strong>GST:</strong> 10AAGCD4586K1ZK</p>
                  <p><strong>Established:</strong> 2017</p>
                </div>
              </section>

              {/* Contact Information */}
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">Contact Us</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-foreground">Registered Office</p>
                      <p>PIPARWAN, PANCHAYAT-JAITIPUR, NAUBATPUR, PATNA 800014</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 mt-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="font-medium text-foreground mb-2">Chandrakant Akela</p>
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <Phone className="w-4 h-4" />
                        <span>9801005212, 8709127232</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4" />
                        <span>chandrakant@divyanshisolar.com</span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="font-medium text-foreground mb-2">Anil</p>
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <Phone className="w-4 h-4" />
                        <span>9123141987</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4" />
                        <span>anil@divyanshisolar.com</span>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="font-medium text-foreground mb-2">Sanjay</p>
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <Phone className="w-4 h-4" />
                        <span>8777684575</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4" />
                        <span>sanjay@divyanshisolar.com</span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
