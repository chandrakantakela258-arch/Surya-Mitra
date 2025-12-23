import { Link as WouterLink } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft } from "lucide-react";
import logoImage from "@assets/88720521_logo_1766219255006.png";
import { SubsidyCalculator } from "@/components/subsidy-calculator";

export default function SubsidyCalculatorPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            <WouterLink href="/">
              <Button variant="ghost" size="sm" className="gap-2" data-testid="button-back-home">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </WouterLink>
            <WouterLink href="/">
              <img 
                src={logoImage} 
                alt="Divyanshi Solar" 
                className="h-8 w-auto object-contain"
              />
            </WouterLink>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <WouterLink href="/login">
                <Button variant="ghost" size="sm" data-testid="button-login">
                  Login
                </Button>
              </WouterLink>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SubsidyCalculator showCommission="none" />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            This calculator provides estimates based on PM Surya Ghar Yojana guidelines. 
            Actual subsidy amounts may vary based on state policies and eligibility criteria.
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <WouterLink href="/customer-registration">
              <Button data-testid="button-register-interest">
                Register Your Interest
              </Button>
            </WouterLink>
            <WouterLink href="/login">
              <Button variant="outline" data-testid="button-partner-login">
                Partner Login
              </Button>
            </WouterLink>
          </div>
        </div>
      </footer>
    </div>
  );
}
