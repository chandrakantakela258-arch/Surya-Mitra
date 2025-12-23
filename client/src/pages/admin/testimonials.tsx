import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Star,
  Video,
  Image,
  Clock,
} from "lucide-react";
import { SiFacebook, SiInstagram } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CustomerTestimonial } from "@shared/schema";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500 text-white",
  approved: "bg-green-500 text-white",
  rejected: "bg-red-500 text-white",
  featured: "bg-purple-500 text-white",
};

export default function AdminTestimonials() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTestimonial, setSelectedTestimonial] = useState<CustomerTestimonial | null>(null);

  const { data: testimonials, isLoading } = useQuery<CustomerTestimonial[]>({
    queryKey: ["/api/admin/testimonials"],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("POST", `/api/admin/testimonials/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      toast({ title: "Testimonial approved" });
      setSelectedTestimonial(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to approve",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { status?: string; isFeatured?: boolean } }) => {
      return apiRequest("PATCH", `/api/admin/testimonials/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/testimonials"] });
      toast({ title: "Testimonial updated" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredTestimonials = testimonials?.filter((item) => {
    const matchesSearch =
      item.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.testimonialText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerDistrict?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const pendingCount = testimonials?.filter((t) => t.status === "pending").length || 0;
  const approvedCount = testimonials?.filter((t) => t.status === "approved" || t.status === "featured").length || 0;
  const featuredCount = testimonials?.filter((t) => t.isFeatured).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Customer Testimonials
          </h1>
          <p className="text-muted-foreground">Review and manage customer testimonials</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                <Star className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{featuredCount}</p>
                <p className="text-sm text-muted-foreground">Featured</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Testimonials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer name, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-testimonials"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!filteredTestimonials || filteredTestimonials.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No testimonials found</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTestimonials.map((testimonial) => (
                <Card key={testimonial.id} className="overflow-hidden" data-testid={`card-testimonial-${testimonial.id}`}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[testimonial.status]}>
                          {testimonial.status}
                        </Badge>
                        {testimonial.isFeatured && (
                          <Badge variant="outline" className="border-purple-500 text-purple-600">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {testimonial.videoUrl && <Video className="h-4 w-4 text-muted-foreground" />}
                        {testimonial.plantPhotos && testimonial.plantPhotos.length > 0 && (
                          <Image className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{testimonial.customerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.customerDistrict}, {testimonial.customerState}
                      </p>
                      {testimonial.installedCapacity && (
                        <p className="text-xs text-muted-foreground">{testimonial.installedCapacity} kW System</p>
                      )}
                    </div>
                    {testimonial.rating && (
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i < testimonial.rating! ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
                          />
                        ))}
                      </div>
                    )}
                    {testimonial.testimonialText && (
                      <p className="text-sm line-clamp-3">{testimonial.testimonialText}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {testimonial.sharedOnFacebook && <SiFacebook className="h-3 w-3" />}
                      {testimonial.sharedOnInstagram && <SiInstagram className="h-3 w-3" />}
                      <span>{new Date(testimonial.createdAt!).toLocaleDateString("en-IN")}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedTestimonial(testimonial)}
                      data-testid={`button-view-${testimonial.id}`}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedTestimonial} onOpenChange={(open) => !open && setSelectedTestimonial(null)}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Testimonial Details</DialogTitle>
            <DialogDescription>
              From {selectedTestimonial?.customerName}
            </DialogDescription>
          </DialogHeader>
          {selectedTestimonial && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge className={statusColors[selectedTestimonial.status]}>
                    {selectedTestimonial.status}
                  </Badge>
                  {selectedTestimonial.rating && (
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < selectedTestimonial.rating! ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="featured" className="text-sm">Featured</Label>
                  <Switch
                    id="featured"
                    checked={selectedTestimonial.isFeatured || false}
                    onCheckedChange={(checked) => {
                      updateMutation.mutate({
                        id: selectedTestimonial.id,
                        data: { isFeatured: checked },
                      });
                    }}
                    data-testid="switch-featured"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <p className="font-medium">{selectedTestimonial.customerName}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTestimonial.customerDistrict}, {selectedTestimonial.customerState}
                </p>
                {selectedTestimonial.installedCapacity && (
                  <p className="text-sm text-muted-foreground">{selectedTestimonial.installedCapacity} kW System</p>
                )}
              </div>
              {selectedTestimonial.testimonialText && (
                <div className="p-4 bg-muted rounded-md">
                  <p className="text-sm italic">"{selectedTestimonial.testimonialText}"</p>
                </div>
              )}
              {selectedTestimonial.videoUrl && (
                <div>
                  <p className="text-sm font-medium mb-2">Video Testimonial:</p>
                  <video
                    src={selectedTestimonial.videoUrl}
                    controls
                    className="w-full rounded-md max-h-64"
                  />
                  {selectedTestimonial.videoDuration && (
                    <p className="text-xs text-muted-foreground mt-1">{selectedTestimonial.videoDuration} seconds</p>
                  )}
                </div>
              )}
              {selectedTestimonial.plantPhotos && selectedTestimonial.plantPhotos.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Installation Photos:</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedTestimonial.plantPhotos.map((photo, idx) => (
                      <img
                        key={idx}
                        src={photo}
                        alt={`Installation ${idx + 1}`}
                        className="w-24 h-24 object-cover rounded-md"
                      />
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                <span>Submitted: {new Date(selectedTestimonial.createdAt!).toLocaleString("en-IN")}</span>
                {selectedTestimonial.sharedOnFacebook && (
                  <Badge variant="outline" className="gap-1">
                    <SiFacebook className="h-3 w-3" /> Shared
                  </Badge>
                )}
                {selectedTestimonial.sharedOnInstagram && (
                  <Badge variant="outline" className="gap-1">
                    <SiInstagram className="h-3 w-3" /> Shared
                  </Badge>
                )}
              </div>
              {selectedTestimonial.status === "pending" && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    className="flex-1"
                    onClick={() => approveMutation.mutate(selectedTestimonial.id)}
                    disabled={approveMutation.isPending}
                    data-testid="button-approve"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      updateMutation.mutate({
                        id: selectedTestimonial.id,
                        data: { status: "rejected" },
                      });
                      setSelectedTestimonial(null);
                    }}
                    disabled={updateMutation.isPending}
                    data-testid="button-reject"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
