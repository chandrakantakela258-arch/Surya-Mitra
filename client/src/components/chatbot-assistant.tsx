import { useState, cloneElement, isValidElement, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircleQuestion, X, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { ChatbotFaq } from "@shared/schema";

interface ChatbotAssistantProps {
  trigger?: ReactNode;
}

const defaultFaqs: ChatbotFaq[] = [
  {
    id: "1",
    question: "What is PM Surya Ghar Yojana?",
    answer: "PM Surya Ghar Yojana is a government initiative to promote rooftop solar installations across India. The scheme provides subsidies for residential solar panel installations to help reduce electricity costs and promote clean energy.",
    category: "general",
    keywords: ["surya ghar", "yojana", "scheme", "government"],
    isActive: "active",
    sortOrder: 0,
    createdAt: new Date(),
  },
  {
    id: "2",
    question: "What is the subsidy available under this scheme?",
    answer: "Central subsidy: Rs 30,000 for 1kW, Rs 60,000 for 2kW, Rs 78,000 for 3kW and above. Some states like Odisha (+Rs 20,000/kW) and Uttar Pradesh (+Rs 10,000/kW) offer additional subsidies. Subsidy is only available for DCR panels.",
    category: "subsidy",
    keywords: ["subsidy", "amount", "central", "state"],
    isActive: "active",
    sortOrder: 1,
    createdAt: new Date(),
  },
  {
    id: "3",
    question: "What is the difference between DCR and Non-DCR panels?",
    answer: "DCR (Domestic Content Requirement) panels are manufactured in India and are eligible for government subsidy. Non-DCR panels are imported and do not qualify for subsidy but are generally less expensive. DCR panels: Rs 75/W (Hybrid) or Rs 66/W (Ongrid). Non-DCR: Rs 55/W.",
    category: "installation",
    keywords: ["dcr", "non-dcr", "panels", "difference"],
    isActive: "active",
    sortOrder: 2,
    createdAt: new Date(),
  },
  {
    id: "4",
    question: "How long does installation take?",
    answer: "Typical installation takes 1-3 days depending on the system size. The entire process from application to grid connection usually takes 4-8 weeks, including approvals and documentation.",
    category: "installation",
    keywords: ["installation", "time", "duration", "days"],
    isActive: "active",
    sortOrder: 3,
    createdAt: new Date(),
  },
  {
    id: "5",
    question: "How can I track my commission earnings?",
    answer: "You can view your commission details in the Commissions section of your dashboard. Commissions are automatically calculated when a customer's installation is marked as complete. DDP partners earn Rs 20,000 for 3kW, Rs 35,000 for 5kW, and Rs 6,000/kW for 6+ kW on DCR panels.",
    category: "payment",
    keywords: ["commission", "earnings", "payment", "track"],
    isActive: "active",
    sortOrder: 4,
    createdAt: new Date(),
  },
  {
    id: "6",
    question: "How do I add my bank account for payouts?",
    answer: "Go to your Profile page and scroll to the Bank Account Details section. Enter your account holder name, account number, IFSC code, and bank name. Once verified, your commissions will be transferred to this account.",
    category: "payment",
    keywords: ["bank", "account", "payout", "add"],
    isActive: "active",
    sortOrder: 5,
    createdAt: new Date(),
  },
];

export function ChatbotAssistant({ trigger }: ChatbotAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const { data: faqs = defaultFaqs } = useQuery<ChatbotFaq[]>({
    queryKey: ["/api/faqs"],
  });

  const allFaqs = faqs.length > 0 ? faqs : defaultFaqs;

  const filteredFaqs = searchQuery
    ? allFaqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
          faq.keywords?.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : allFaqs;

  const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
    const category = faq.category || "general";
    if (!acc[category]) acc[category] = [];
    acc[category].push(faq);
    return acc;
  }, {} as Record<string, ChatbotFaq[]>);

  const categoryLabels: Record<string, string> = {
    general: "General",
    subsidy: "Subsidy Information",
    installation: "Installation",
    payment: "Payments & Commissions",
    partner: "Partner Program",
  };

  const faqContent = (
    <>
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-chatbot-search"
          />
        </div>
      </div>
      <ScrollArea className="h-[350px]">
        <div className="p-3 space-y-3">
          {Object.entries(groupedFaqs).map(([category, categoryFaqs]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                {categoryLabels[category] || category}
              </h4>
              <div className="space-y-1">
                {categoryFaqs.map((faq) => (
                  <Collapsible
                    key={faq.id}
                    open={expandedFaq === faq.id}
                    onOpenChange={() =>
                      setExpandedFaq(expandedFaq === faq.id ? null : faq.id)
                    }
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-left text-sm rounded-md hover-elevate">
                      <span className="flex-1 pr-2">{faq.question}</span>
                      {expandedFaq === faq.id ? (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-2 pb-2">
                      <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                        {faq.answer}
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </div>
          ))}
          {filteredFaqs.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No matching questions found. Try a different search term.
            </div>
          )}
        </div>
      </ScrollArea>
    </>
  );

  // If a trigger is provided, use Dialog pattern
  if (trigger) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <MessageCircleQuestion className="h-5 w-5" />
              Help Assistant
            </DialogTitle>
          </DialogHeader>
          {faqContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Floating button pattern (default)
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        size="icon"
        data-testid="button-chatbot-open"
      >
        <MessageCircleQuestion className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 max-h-[500px] shadow-xl z-50 flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between gap-4 py-3 px-4 border-b">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircleQuestion className="h-5 w-5" />
          Help Assistant
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          data-testid="button-chatbot-close"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      {faqContent}
    </Card>
  );
}
