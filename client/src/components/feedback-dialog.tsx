import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MessageSquarePlus, Bug, Lightbulb, AlertCircle, MessageCircle } from "lucide-react";
import type { Feedback } from "@shared/schema";

const feedbackSchema = z.object({
  type: z.enum(["bug", "suggestion", "complaint", "other"]),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(20, "Please provide more details (at least 20 characters)"),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

const feedbackTypes = [
  { value: "bug", label: "Report a Bug", icon: Bug },
  { value: "suggestion", label: "Suggestion", icon: Lightbulb },
  { value: "complaint", label: "Complaint", icon: AlertCircle },
  { value: "other", label: "Other", icon: MessageCircle },
];

const statusColors: Record<string, string> = {
  pending: "border-yellow-500 text-yellow-600",
  reviewed: "border-blue-500 text-blue-600",
  resolved: "border-green-500 text-green-600",
};

interface FeedbackDialogProps {
  trigger?: React.ReactNode;
}

export function FeedbackDialog({ trigger }: FeedbackDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: myFeedback, isLoading } = useQuery<Feedback[]>({
    queryKey: ["/api/feedback"],
    enabled: open,
  });

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: "suggestion",
      subject: "",
      message: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: FeedbackFormData) => {
      return apiRequest("POST", "/api/feedback", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      toast({ title: "Feedback submitted successfully" });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit feedback",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FeedbackFormData) => {
    submitMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" data-testid="button-feedback">
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            Feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share Your Feedback</DialogTitle>
          <DialogDescription>
            Report bugs, suggest improvements, or share your thoughts with us
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="submit" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="submit" data-testid="tab-submit-feedback">Submit Feedback</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-feedback-history">My Submissions</TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feedback Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-feedback-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {feedbackTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              <div className="flex items-center gap-2">
                                <type.icon className="w-4 h-4" />
                                {type.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Brief summary of your feedback"
                          {...field}
                          data-testid="input-feedback-subject"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please describe in detail..."
                          className="min-h-[120px]"
                          {...field}
                          data-testid="textarea-feedback-message"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitMutation.isPending}
                  data-testid="button-submit-feedback"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Feedback"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : myFeedback && myFeedback.length > 0 ? (
              <div className="space-y-3">
                {myFeedback.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 border rounded-lg space-y-2"
                    data-testid={`feedback-item-${item.id}`}
                  >
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline">{item.type}</Badge>
                        <Badge variant="outline" className={statusColors[item.status]}>
                          {item.status}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.createdAt!).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-medium">{item.subject}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.message}</p>
                    {item.adminNotes && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">Admin Response:</p>
                        <p className="text-sm">{item.adminNotes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No feedback submitted yet
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
