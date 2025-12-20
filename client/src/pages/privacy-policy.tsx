import { Link as WouterLink } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sun, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
            <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-muted-foreground mb-4">
              <strong>Divyanshi Solar (Divyanshi Digital Services Pvt. Ltd.)</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-8">Last Updated: December 2024</p>

            <div className="space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Introduction</h2>
                <p>
                  Divyanshi Solar, a brand of Divyanshi Digital Services Pvt. Ltd., is committed to protecting your privacy. 
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
                  our services related to PM Surya Ghar Yojana solar installations.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Information We Collect</h2>
                <p className="mb-2">We may collect the following types of information:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Personal identification information (name, email, phone number, address)</li>
                  <li>Government-issued identification documents (Aadhaar, PAN) for subsidy processing</li>
                  <li>Electricity bill details and consumption data</li>
                  <li>Property details including rooftop specifications</li>
                  <li>Bank account details for subsidy disbursement</li>
                  <li>Payment transaction information</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
                <p className="mb-2">Your information is used for:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Processing your solar installation application under PM Surya Ghar Yojana</li>
                  <li>Conducting site surveys and technical assessments</li>
                  <li>Coordinating with DISCOM for net metering approvals</li>
                  <li>Facilitating government subsidy claims and disbursement</li>
                  <li>Providing customer support and service updates</li>
                  <li>Communicating important information about your installation</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Information Sharing</h2>
                <p>
                  We may share your information with government authorities (for subsidy processing), 
                  electricity distribution companies (for net metering), authorized installation partners, 
                  and payment processors. We do not sell your personal information to third parties.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Security</h2>
                <p>
                  We implement appropriate technical and organizational measures to protect your personal 
                  information against unauthorized access, alteration, disclosure, or destruction.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Your Rights</h2>
                <p>
                  You have the right to access, correct, or delete your personal information. 
                  To exercise these rights, please contact us using the details provided below.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Contact Us</h2>
                <p className="mb-2">For privacy-related inquiries, please contact:</p>
                <p><strong>Divyanshi Digital Services Pvt. Ltd.</strong></p>
                <p>PIPARWAN, PANCHAYAT-JAITIPUR, NAUBATPUR, PATNA 800014</p>
                <p>Email: chandrakant@apnaatm.com</p>
                <p>Phone: 9801005212, 8709127232</p>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
