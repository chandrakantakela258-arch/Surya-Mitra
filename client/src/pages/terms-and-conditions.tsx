import { Link as WouterLink } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sun, ArrowLeft } from "lucide-react";

export default function TermsAndConditionsPage() {
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
            <h1 className="text-3xl font-bold mb-6">Terms and Conditions</h1>
            <p className="text-muted-foreground mb-4">
              <strong>Divyanshi Solar (Divyanshi Digital Services Pvt. Ltd.)</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-8">Last Updated: December 2024</p>

            <div className="space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
                <p>
                  By accessing or using the services of Divyanshi Solar (a brand of Divyanshi Digital Services Pvt. Ltd.), 
                  you agree to be bound by these Terms and Conditions. If you do not agree to these terms, 
                  please do not use our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Services</h2>
                <p>
                  Divyanshi Solar provides rooftop solar installation services under PM Surya Ghar Yojana, 
                  including application processing, site surveys, solar panel installation, net metering 
                  coordination, and subsidy claim assistance.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. Eligibility</h2>
                <p className="mb-2">To avail our services, you must:</p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>Be an Indian citizen with valid identification</li>
                  <li>Own a residential property with suitable rooftop space</li>
                  <li>Have a valid electricity connection in your name</li>
                  <li>Not have previously availed solar subsidy under any government scheme</li>
                  <li>Provide accurate and complete information for application processing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Payment Terms</h2>
                <p className="mb-2">
                  Payment terms will be specified in the quotation provided after site survey. Generally:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>An advance payment may be required to initiate the installation process</li>
                  <li>Remaining payment as per agreed milestones</li>
                  <li>Government subsidy will be credited directly to your bank account after installation and inspection</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Installation</h2>
                <p>
                  Installation timelines are indicative and may vary based on DISCOM approvals, weather conditions, 
                  and availability of materials. We will keep you informed of any delays. The customer is responsible 
                  for providing safe access to the installation site.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Warranty</h2>
                <p>
                  Product warranties are provided by the respective manufacturers. We will assist you in 
                  warranty claims as per manufacturer terms. Warranty does not cover damage due to misuse, 
                  natural calamities, or unauthorized modifications.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Cancellation and Refund</h2>
                <p>
                  Cancellation requests must be submitted in writing. Refunds will be processed as per our 
                  refund policy, minus any costs already incurred. Cancellation after installation has begun 
                  may not be eligible for full refund.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">8. Partner Terms</h2>
                <p>
                  Business Development Partners (BDP) and District Development Partners (DDP) are subject 
                  to additional partnership agreements. Commission structures and terms are as specified 
                  in the partner agreement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">9. Governing Law</h2>
                <p>
                  These Terms and Conditions shall be governed by and construed in accordance with the laws 
                  of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Patna, Bihar.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">10. Modifications</h2>
                <p>
                  We reserve the right to modify these Terms and Conditions at any time. Changes will be 
                  effective upon posting on our website. Continued use of our services after changes 
                  constitutes acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">11. Contact Information</h2>
                <p className="mb-2">For questions about these Terms and Conditions, please contact:</p>
                <p><strong>Divyanshi Digital Services Pvt. Ltd.</strong></p>
                <p>PIPARWAN, PANCHAYAT-JAITIPUR, NAUBATPUR, PATNA 800014</p>
                <p className="mt-2"><strong>Chandrakant Akela:</strong> 9801005212, 8709127232</p>
                <p>Email: chandrakant@apnaatm.com</p>
                <p className="mt-2"><strong>Anil:</strong> 9123141987</p>
                <p>Email: anil@apnaatm.com</p>
                <p className="mt-2"><strong>Sanjay:</strong> 8777684575</p>
                <p>Email: sanjay@apnaatm.com</p>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
