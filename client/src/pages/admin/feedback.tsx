import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Bug,
  Lightbulb,
  AlertCircle,
  MessageCircle,
  Search,
  CheckCircle,
  Eye,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Feedback } from "@shared/schema";

const feedbackTypeIcons: Record<string, any> = {
  bug: Bug,
  suggestion: Lightbulb,
  complaint: AlertCircle,
  other: MessageCircle,
};

const statusColors: Record<string, string> = {
  pending: "border-yellow-500 text-yellow-600",
  reviewed: "border-blue-500 text-blue-600",
  resolved: "border-green-500 text-green-600",
};

export default function AdminFeedback() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: feedbackList, isLoading } = useQuery<Feedback[]>({
    queryKey: ["/api/admin/feedback"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status, adminNotes }: { id: string; status: string; adminNotes?: string }) => {
      return apiRequest("PATCH", `/api/admin/feedback/${id}`, { status, adminNotes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/feedback"] });
      toast({ title: "Feedback updated successfully" });
      setSelectedFeedback(null);
      setAdminNotes("");
      setNewStatus("");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update feedback",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredFeedback = feedbackList?.filter((item) => {
    const matchesSearch =
      item.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || item.type === typeFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleOpenFeedback = (item: Feedback) => {
    setSelectedFeedback(item);
    setAdminNotes(item.adminNotes || "");
    setNewStatus(item.status);
  };

  const handleUpdateFeedback = () => {
    if (selectedFeedback && newStatus) {
      updateMutation.mutate({
        id: selectedFeedback.id,
        status: newStatus,
        adminNotes: adminNotes || undefined,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const pendingCount = feedbackList?.filter((f) => f.status === "pending").length || 0;
  const reviewedCount = feedbackList?.filter((f) => f.status === "reviewed").length || 0;
  const resolvedCount = feedbackList?.filter((f) => f.status === "resolved").length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-page-title">User Feedback</h1>
        <p className="text-muted-foreground">Review and respond to user feedback</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
              <MessageSquare className="w-8 h-8 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-2xl font-bold text-blue-600">{reviewedCount}</p>
                <p className="text-sm text-muted-foreground">Reviewed</p>
              </div>
              <Eye className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search feedback..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-feedback"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-type-filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="bug">Bug</SelectItem>
                <SelectItem value="suggestion">Suggestion</SelectItem>
                <SelectItem value="complaint">Complaint</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewed">Reviewed</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredFeedback && filteredFeedback.length > 0 ? (
              filteredFeedback.map((item) => {
                const TypeIcon = feedbackTypeIcons[item.type] || MessageCircle;
                return (
                  <div
                    key={item.id}
                    className="p-4 border rounded-lg bg-card hover-elevate cursor-pointer"
                    onClick={() => handleOpenFeedback(item)}
                    data-testid={`card-feedback-${item.id}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <TypeIcon className="w-4 h-4 text-muted-foreground" />
                          <h3 className="font-semibold">{item.subject}</h3>
                          <Badge variant="outline">{item.type}</Badge>
                          <Badge variant="outline" className={statusColors[item.status]}>
                            {item.status}
                          </Badge>
                          {item.priority && item.priority !== "normal" && (
                            <Badge variant={item.priority === "critical" ? "destructive" : "secondary"}>
                              {item.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{item.message}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>
                            {new Date(item.createdAt!).toLocaleDateString()} at{" "}
                            {new Date(item.createdAt!).toLocaleTimeString()}
                          </span>
                          {item.userName && <span>from {item.userName}</span>}
                          {item.page && <span>on {item.page}</span>}
                        </div>
                      </div>
                      <Button size="sm" variant="outline" data-testid={`button-view-${item.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">No feedback found</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
          </DialogHeader>
          {selectedFeedback && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{selectedFeedback.type}</Badge>
                <Badge variant="outline" className={statusColors[selectedFeedback.status]}>
                  {selectedFeedback.status}
                </Badge>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(selectedFeedback.createdAt!).toLocaleString()}
                </span>
              </div>

              {selectedFeedback.priority && selectedFeedback.priority !== "normal" && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Priority:</span>
                  <Badge variant={selectedFeedback.priority === "critical" ? "destructive" : "secondary"}>
                    {selectedFeedback.priority}
                  </Badge>
                </div>
              )}

              {(selectedFeedback.userEmail || selectedFeedback.userName || selectedFeedback.page) && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-1 text-sm">Submitted By</h4>
                  {selectedFeedback.userName && (
                    <p className="text-sm">{selectedFeedback.userName}</p>
                  )}
                  {selectedFeedback.userEmail && (
                    <p className="text-sm text-muted-foreground">{selectedFeedback.userEmail}</p>
                  )}
                  {selectedFeedback.page && (
                    <p className="text-xs text-muted-foreground mt-1">Page: {selectedFeedback.page}</p>
                  )}
                </div>
              )}

              <div>
                <h4 className="font-semibold mb-1">Subject</h4>
                <p>{selectedFeedback.subject}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Message</h4>
                <p className="text-sm whitespace-pre-wrap">{selectedFeedback.message}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Update Status</h4>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger data-testid="select-new-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Admin Notes (visible to user)</h4>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add a response for the user..."
                  className="min-h-[80px]"
                  data-testid="textarea-admin-notes"
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateFeedback}
                  disabled={updateMutation.isPending || !newStatus}
                  data-testid="button-update-feedback"
                >
                  {updateMutation.isPending ? "Updating..." : "Update Feedback"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
