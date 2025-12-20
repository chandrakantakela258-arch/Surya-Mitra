import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { ArrowLeft, User, MapPin, Zap, Home, Phone, Mail, FileText, CheckCircle, Circle, Clock, Loader2, Camera, Video, X, Upload, Image, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { StatusBadge } from "@/components/status-badge";
import { calculateSubsidy, formatINR } from "@/components/subsidy-calculator";
import { installationMilestones, type Customer, type Milestone } from "@shared/schema";
import { useState, useRef } from "react";

function SiteMediaUpload({ customer }: { customer: Customer }) {
  const { toast } = useToast();
  const pictureInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"pictures" | "video" | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState(false);
  
  const uploadPicturesMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("pictures", file));
      
      const response = await fetch(`/api/ddp/customers/${customer.id}/site-pictures`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customer.id] });
      toast({ title: `${data.count} pictures uploaded successfully` });
      setUploading(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to upload pictures", description: error.message, variant: "destructive" });
      setUploading(null);
    }
  });
  
  const uploadVideoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("video", file);
      
      const response = await fetch(`/api/ddp/customers/${customer.id}/site-video`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customer.id] });
      toast({ title: "Video uploaded successfully" });
      setUploading(null);
    },
    onError: (error: any) => {
      toast({ title: "Failed to upload video", description: error.message, variant: "destructive" });
      setUploading(null);
    }
  });
  
  const deletePictureMutation = useMutation({
    mutationFn: async (index: number) => {
      const response = await fetch(`/api/ddp/customers/${customer.id}/site-pictures/${index}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Delete failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customer.id] });
      toast({ title: "Picture deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete picture", variant: "destructive" });
    }
  });
  
  const deleteVideoMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/ddp/customers/${customer.id}/site-video`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Delete failed");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customer.id] });
      toast({ title: "Video deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete video", variant: "destructive" });
    }
  });
  
  function handlePictureSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    
    const currentCount = customer.sitePictures?.length || 0;
    const remainingSlots = 6 - currentCount;
    
    if (files.length > remainingSlots) {
      toast({ 
        title: `Can only upload ${remainingSlots} more pictures`, 
        description: "Maximum 6 pictures allowed", 
        variant: "destructive" 
      });
      return;
    }
    
    setUploading("pictures");
    uploadPicturesMutation.mutate(files);
    e.target.value = "";
  }
  
  function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "Video too large", description: "Maximum file size is 100MB", variant: "destructive" });
      return;
    }
    
    setUploading("video");
    uploadVideoMutation.mutate(file);
    e.target.value = "";
  }
  
  const sitePictures = customer.sitePictures || [];
  const canAddMorePictures = sitePictures.length < 6;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          Site Media
        </CardTitle>
        <CardDescription>
          Upload site pictures (6 angles) and highlight video (9:16, max 60 sec)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h4 className="font-medium flex items-center gap-2">
                <Image className="w-4 h-4" />
                Site Pictures
              </h4>
              <p className="text-sm text-muted-foreground">
                {sitePictures.length}/6 pictures uploaded
              </p>
            </div>
            {canAddMorePictures && (
              <Button
                size="sm"
                onClick={() => pictureInputRef.current?.click()}
                disabled={uploading === "pictures"}
                data-testid="button-upload-pictures"
              >
                {uploading === "pictures" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Add Pictures
                  </>
                )}
              </Button>
            )}
            <input
              ref={pictureInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePictureSelect}
              data-testid="input-pictures"
            />
          </div>
          
          {sitePictures.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {sitePictures.map((url, index) => (
                <div key={index} className="relative group aspect-square">
                  <img 
                    src={url} 
                    alt={`Site picture ${index + 1}`}
                    className="w-full h-full object-cover rounded-md cursor-pointer"
                    onClick={() => setPreviewImage(url)}
                    data-testid={`img-site-picture-${index}`}
                  />
                  <button
                    onClick={() => deletePictureMutation.mutate(index)}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={deletePictureMutation.isPending}
                    data-testid={`button-delete-picture-${index}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {Array.from({ length: 6 - sitePictures.length }).map((_, index) => (
                <div 
                  key={`empty-${index}`}
                  className="aspect-square border-2 border-dashed border-muted rounded-md flex items-center justify-center cursor-pointer hover-elevate"
                  onClick={() => pictureInputRef.current?.click()}
                >
                  <Camera className="w-6 h-6 text-muted-foreground" />
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-muted rounded-md p-8 text-center cursor-pointer hover-elevate"
              onClick={() => pictureInputRef.current?.click()}
            >
              <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Click to upload site pictures</p>
              <p className="text-xs text-muted-foreground">Upload 6 pictures from different angles</p>
            </div>
          )}
        </div>
        
        <Separator />
        
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h4 className="font-medium flex items-center gap-2">
                <Video className="w-4 h-4" />
                Highlight Video
              </h4>
              <p className="text-sm text-muted-foreground">
                9:16 Instagram-style video (max 60 seconds)
              </p>
            </div>
            {!customer.siteVideo && (
              <Button
                size="sm"
                onClick={() => videoInputRef.current?.click()}
                disabled={uploading === "video"}
                data-testid="button-upload-video"
              >
                {uploading === "video" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Video
                  </>
                )}
              </Button>
            )}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoSelect}
              data-testid="input-video"
            />
          </div>
          
          {customer.siteVideo ? (
            <div className="relative group">
              <div 
                className="aspect-[9/16] max-w-[200px] bg-muted rounded-md overflow-hidden cursor-pointer"
                onClick={() => setPreviewVideo(true)}
              >
                <video 
                  src={customer.siteVideo} 
                  className="w-full h-full object-cover"
                  data-testid="video-site"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="w-12 h-12 text-white" />
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => deleteVideoMutation.mutate()}
                disabled={deleteVideoMutation.isPending}
                data-testid="button-delete-video"
              >
                <X className="w-4 h-4" />
              </Button>
              <div className="mt-2">
                <Badge variant="outline">
                  {customer.proposedCapacity || "?"} kW - {customer.district}
                </Badge>
              </div>
            </div>
          ) : (
            <div 
              className="border-2 border-dashed border-muted rounded-md p-8 text-center cursor-pointer hover-elevate max-w-[200px]"
              onClick={() => videoInputRef.current?.click()}
            >
              <Video className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Upload video</p>
              <p className="text-xs text-muted-foreground">9:16 format, max 60s</p>
            </div>
          )}
        </div>
        
        <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Site Picture</DialogTitle>
            </DialogHeader>
            {previewImage && (
              <img src={previewImage} alt="Site preview" className="w-full rounded-md" />
            )}
          </DialogContent>
        </Dialog>
        
        <Dialog open={previewVideo} onOpenChange={setPreviewVideo}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Site Highlight Video</DialogTitle>
              <DialogDescription>
                {customer.name} - {customer.proposedCapacity} kW - {customer.address}, {customer.district}
              </DialogDescription>
            </DialogHeader>
            {customer.siteVideo && (
              <video 
                src={customer.siteVideo} 
                controls 
                autoPlay 
                className="w-full aspect-[9/16] rounded-md"
                data-testid="video-preview"
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function MilestoneTimeline({ customerId }: { customerId: string }) {
  const { toast } = useToast();
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);
  const [notes, setNotes] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const { data: milestones, isLoading } = useQuery<Milestone[]>({
    queryKey: ["/api/customers", customerId, "milestones"],
  });
  
  const completeMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      return apiRequest("PATCH", `/api/milestones/${id}/complete`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers", customerId, "milestones"] });
      toast({ title: "Milestone completed successfully" });
      setDialogOpen(false);
      setSelectedMilestone(null);
      setNotes("");
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to complete milestone", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  function getMilestoneInfo(key: string) {
    return installationMilestones.find(m => m.key === key) || { label: key, description: "" };
  }
  
  function handleComplete(milestone: Milestone) {
    setSelectedMilestone(milestone);
    setNotes("");
    setDialogOpen(true);
  }
  
  function confirmComplete() {
    if (selectedMilestone) {
      completeMutation.mutate({ id: selectedMilestone.id, notes });
    }
  }
  
  const completedCount = milestones?.filter(m => m.status === "completed").length || 0;
  const totalCount = milestones?.length || installationMilestones.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold">Installation Progress</h3>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {totalCount} milestones completed
          </p>
        </div>
        <Badge variant="outline" className="text-lg font-mono">
          {progressPercent}%
        </Badge>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      <div className="relative space-y-0">
        {milestones?.map((milestone, index) => {
          const info = getMilestoneInfo(milestone.milestone);
          const isCompleted = milestone.status === "completed";
          const isLast = index === milestones.length - 1;
          const prevCompleted = index === 0 || milestones[index - 1].status === "completed";
          const canComplete = !isCompleted && prevCompleted;
          
          return (
            <div key={milestone.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${isCompleted 
                    ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400" 
                    : canComplete 
                      ? "bg-primary/10 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                  }
                `}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : canComplete ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                </div>
                {!isLast && (
                  <div className={`w-0.5 h-12 ${isCompleted ? "bg-green-300 dark:bg-green-700" : "bg-muted"}`} />
                )}
              </div>
              
              <div className={`flex-1 pb-6 ${isLast ? "pb-0" : ""}`}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className={`font-medium ${isCompleted ? "text-green-600 dark:text-green-400" : ""}`}>
                      {info.label}
                    </p>
                    <p className="text-sm text-muted-foreground">{info.description}</p>
                    {milestone.completedAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Completed: {new Date(milestone.completedAt).toLocaleDateString()}
                      </p>
                    )}
                    {milestone.notes && (
                      <p className="text-sm text-muted-foreground mt-1 italic">
                        Note: {milestone.notes}
                      </p>
                    )}
                  </div>
                  
                  {canComplete && (
                    <Button 
                      size="sm" 
                      onClick={() => handleComplete(milestone)}
                      data-testid={`button-complete-${milestone.milestone}`}
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Milestone</DialogTitle>
            <DialogDescription>
              Mark "{selectedMilestone && getMilestoneInfo(selectedMilestone.milestone).label}" as completed
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea 
                id="notes"
                placeholder="Add any notes about this milestone..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                data-testid="input-milestone-notes"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmComplete} 
              disabled={completeMutation.isPending}
              data-testid="button-confirm-complete"
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                "Complete Milestone"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CustomerDetail() {
  const [, params] = useRoute("/ddp/customers/:id");
  const [, setLocation] = useLocation();
  const customerId = params?.id;
  
  const { data: customer, isLoading } = useQuery<Customer>({
    queryKey: ["/api/customers", customerId],
    enabled: !!customerId,
  });
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }
  
  if (!customer) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Customer not found</p>
        <Button variant="ghost" onClick={() => setLocation("/ddp/customers")}>
          Back to customers
        </Button>
      </div>
    );
  }
  
  const capacityNum = parseFloat(customer.proposedCapacity || "0") || 0;
  const subsidyInfo = capacityNum > 0 ? calculateSubsidy(Math.min(capacityNum, 10)) : null;
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/ddp/customers")}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold" data-testid="text-customer-name">{customer.name}</h1>
            <StatusBadge status={customer.status} />
          </div>
          <p className="text-muted-foreground">{customer.district}, {customer.state}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="font-mono">{customer.phone}</span>
              </div>
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p>{customer.address}</p>
                  <p className="text-muted-foreground">
                    {customer.district}, {customer.state} - {customer.pincode}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Electricity Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">DISCOM</dt>
                  <dd className="font-medium">{customer.electricityBoard || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Consumer No.</dt>
                  <dd className="font-medium font-mono">{customer.consumerNumber || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Sanctioned Load</dt>
                  <dd className="font-medium">{customer.sanctionedLoad || "-"} kW</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Avg. Monthly Bill</dt>
                  <dd className="font-medium">{customer.avgMonthlyBill ? formatINR(customer.avgMonthlyBill) : "-"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" />
                Roof & Installation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Roof Type</dt>
                  <dd className="font-medium">{customer.roofType || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Roof Area</dt>
                  <dd className="font-medium">{customer.roofArea || "-"} sq ft</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-muted-foreground">Proposed Capacity</dt>
                  <dd className="text-2xl font-bold text-primary">{customer.proposedCapacity || "-"} kW</dd>
                </div>
              </dl>
              
              {subsidyInfo && (
                <>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-muted-foreground">System Cost</p>
                      <p className="font-semibold font-mono">{formatINR(subsidyInfo.totalCost)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">Subsidy</p>
                      <p className="font-semibold font-mono text-green-600 dark:text-green-400">
                        -{formatINR(subsidyInfo.totalSubsidy)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Net Cost</p>
                      <p className="font-semibold font-mono text-primary">{formatINR(subsidyInfo.netCost)}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Customer Journey
            </CardTitle>
            <CardDescription>
              Track installation progress and milestones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MilestoneTimeline customerId={customer.id} />
          </CardContent>
        </Card>
        
        <SiteMediaUpload customer={customer} />
      </div>
    </div>
  );
}
