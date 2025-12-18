import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { X, ChevronRight, ChevronLeft, Users, FileText, TrendingUp, Store, Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UserPreferences } from "@shared/schema";

interface TutorialStep {
  title: string;
  description: string;
  icon: typeof Users;
  forRoles: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Welcome to DivyanshiSolar",
    description: "This platform helps you manage solar installation customers under PM Surya Ghar Yojana. Let's take a quick tour of the key features.",
    icon: TrendingUp,
    forRoles: ["bdp", "ddp"],
  },
  {
    title: "Customer Management",
    description: "Register new customers, track their application status, and manage the entire installation journey from application to grid connection.",
    icon: Users,
    forRoles: ["ddp"],
  },
  {
    title: "Partner Network",
    description: "As a BDP, you can onboard District Development Partners (DDPs) to expand your network. Each DDP you onboard helps you earn commissions.",
    icon: Users,
    forRoles: ["bdp"],
  },
  {
    title: "Track Milestones",
    description: "Each customer goes through defined milestones: Application Submitted, Documents Verified, Site Survey, Installation, Grid Connection, and Subsidy Processing.",
    icon: FileText,
    forRoles: ["bdp", "ddp"],
  },
  {
    title: "Earn Commissions",
    description: "Earn commissions when installations are completed. DCR panels: Rs 20,000 (3kW), Rs 35,000 (5kW), Rs 6,000/kW (6+ kW). Non-DCR: Rs 4,000/kW.",
    icon: TrendingUp,
    forRoles: ["bdp", "ddp"],
  },
  {
    title: "Store & Products",
    description: "Browse and purchase solar packages, marketing materials, and accessories for your business through our integrated store.",
    icon: Store,
    forRoles: ["ddp"],
  },
  {
    title: "Profile & Payouts",
    description: "Add your bank account details in your Profile to receive commission payouts directly to your account via Razorpay.",
    icon: Settings,
    forRoles: ["bdp", "ddp"],
  },
];

interface OnboardingTutorialProps {
  userRole: string;
}

export function OnboardingTutorial({ userRole }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: Partial<UserPreferences>) => {
      await apiRequest("PATCH", "/api/preferences", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
    },
  });

  const relevantSteps = tutorialSteps.filter((step) =>
    step.forRoles.includes(userRole)
  );

  useEffect(() => {
    if (preferences && preferences.tutorialCompleted === "false") {
      setShowTutorial(true);
    }
  }, [preferences]);

  const handleNext = () => {
    if (currentStep < relevantSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    updatePreferencesMutation.mutate({ tutorialCompleted: "true" });
    setShowTutorial(false);
  };

  const handleSkip = () => {
    updatePreferencesMutation.mutate({ tutorialCompleted: "true" });
    setShowTutorial(false);
  };

  if (!showTutorial || relevantSteps.length === 0) {
    return null;
  }

  const step = relevantSteps[currentStep];
  const StepIcon = step.icon;
  const progress = ((currentStep + 1) / relevantSteps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <StepIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{step.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {relevantSteps.length}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSkip}
            data-testid="button-tutorial-skip"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="h-2" />
          <p className="text-muted-foreground">{step.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            data-testid="button-tutorial-prev"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          {currentStep === relevantSteps.length - 1 ? (
            <Button onClick={handleComplete} data-testid="button-tutorial-complete">
              <Check className="h-4 w-4 mr-1" />
              Get Started
            </Button>
          ) : (
            <Button onClick={handleNext} data-testid="button-tutorial-next">
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
