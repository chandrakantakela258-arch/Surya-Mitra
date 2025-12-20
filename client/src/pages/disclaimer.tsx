import { Link as WouterLink } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sun, ArrowLeft } from "lucide-react";

export default function DisclaimerPage() {
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
            <h1 className="text-3xl font-bold mb-6">Disclaimer</h1>
            <p className="text-muted-foreground mb-4">
              <strong>Divyanshi Solar (Divyanshi Digital Services Pvt. Ltd.)</strong>
            </p>
            <p className="text-sm text-muted-foreground mb-8">Last Updated: December 2024</p>

            <div className="space-y-6 text-muted-foreground">
              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">1. General Disclaimer</h2>
                <p>
                  The information provided on this website and through our services is for general informational 
                  purposes only. While we strive to keep the information up to date and accurate, we make no 
                  representations or warranties of any kind, express or implied, about the completeness, accuracy, 
                  reliability, suitability, or availability of the information, products, services, or related 
                  graphics contained on this website.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">2. Subsidy Information</h2>
                <p>
                  Subsidy amounts, eligibility criteria, and government policies related to PM Surya Ghar Yojana 
                  are subject to change based on government guidelines and decisions. The subsidy calculations 
                  shown on our platform are indicative and the actual subsidy received may vary based on various 
                  factors including state policies, DISCOM requirements, and government regulations.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">3. Installation and Performance</h2>
                <p>
                  Solar panel performance depends on various factors including weather conditions, roof orientation, 
                  shading, and maintenance. The energy generation estimates provided are based on standard conditions 
                  and actual results may vary. We do not guarantee specific energy savings or electricity bill reductions.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">4. Third-Party Services</h2>
                <p>
                  Our services may involve coordination with government agencies, electricity distribution companies, 
                  and other third parties. We are not responsible for delays, decisions, or actions taken by these 
                  third parties that may affect your solar installation or subsidy disbursement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">5. Pricing</h2>
                <p>
                  All prices mentioned on this website are subject to change without prior notice. Final pricing 
                  will be confirmed during the site survey and quotation process. Additional charges may apply 
                  based on specific installation requirements.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">6. Limitation of Liability</h2>
                <p>
                  To the fullest extent permitted by applicable law, Divyanshi Digital Services Pvt. Ltd. shall 
                  not be liable for any indirect, incidental, special, consequential, or punitive damages, or 
                  any loss of profits or revenues, whether incurred directly or indirectly.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-foreground mb-3">7. Contact</h2>
                <p className="mb-2">For any questions regarding this disclaimer, please contact:</p>
                <p><strong>Divyanshi Digital Services Pvt. Ltd.</strong></p>
                <p>PIPARWAN, PANCHAYAT-JAITIPUR, NAUBATPUR, PATNA 800014</p>
                <p>Email: chandrakant@divyanshisolar.com</p>
                <p>Phone: 9801005212, 8709127232</p>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
