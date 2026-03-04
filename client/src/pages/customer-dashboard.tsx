import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Sun, 
  Phone, 
  ArrowRight, 
  Check,
  CheckCircle2, 
  Clock, 
  MapPin, 
  Calendar, 
  Battery, 
  Zap,
  FileText,
  LogOut,
  Loader2,
  Home,
  User,
  Shield,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Wrench,
  Star,
  Video,
  Camera,
  MessageSquare,
  Plus,
  AlertCircle,
  ThumbsUp,
  Navigation,
  Image,
  X,
  ExternalLink,
  Upload,
  Share2,
  IdCard
} from "lucide-react";
import { SiFacebook, SiInstagram, SiWhatsapp, SiX } from "react-icons/si";
import { ThemeToggle } from "@/components/theme-toggle";
import { installationMilestones } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string;
  district: string;
  state: string;
  pincode: string;
  capacity: string;
  panelType: string;
  customerType: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  subsidyAmount: number;
  createdAt: string;
  portalStatus: string;
  customerCode: string | null;
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  status: string;
  completedAt: string | null;
  visibleToCustomer: boolean;
  documents: string[] | null;
}

interface InstallationProgress {
  customer: CustomerData;
  milestones: Milestone[];
  currentStep: number;
  totalSteps: number;
  percentComplete: number;
}

interface ServiceRequest {
  id: string;
  requestNumber: string;
  issueType: string;
  issueTitle: string;
  issueDescription: string;
  urgency: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  customerFeedbackRating: number | null;
  customerFeedbackText: string | null;
  vendorNotes: string | null;
  resolutionNotes: string | null;
}

interface Testimonial {
  id: string;
  testimonialText: string | null;
  rating: number | null;
  videoUrl: string | null;
  plantPhotos: string[] | null;
  status: string;
  createdAt: string;
  sharedOnFacebook: boolean | null;
  sharedOnInstagram: boolean | null;
}

const issueTypeLabels: Record<string, string> = {
  electrical: "Electrical Issue",
  inverter: "Inverter Problem",
  power_generation: "Power Generation Issue",
  panel_damage: "Panel Damage",
  wiring: "Wiring Problem",
  meter: "Meter Issue",
  other: "Other",
};

const serviceStatusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  assigned: "bg-blue-500",
  in_progress: "bg-purple-500",
  resolved: "bg-green-500",
  closed: "bg-gray-500",
};

const statusLabels: Record<string, string> = {
  pending: "Application Pending",
  approved: "Application Approved",
  documents_verified: "Documents Verified",
  site_survey_scheduled: "Site Survey Scheduled",
  site_survey_completed: "Site Survey Completed",
  portal_submitted: "Portal Submitted",
  feasibility_approved: "Feasibility Approved",
  vendor_assigned: "Vendor Assigned",
  installation_scheduled: "Installation Scheduled",
  installation_in_progress: "Installation In Progress",
  installation_completed: "Installation Completed",
  inspection_scheduled: "Inspection Scheduled",
  inspection_completed: "Inspection Completed",
  net_meter_installed: "Net Meter Installed",
  subsidy_disbursed: "Subsidy Disbursed",
  completed: "Completed",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  approved: "bg-green-500",
  documents_verified: "bg-blue-500",
  site_survey_scheduled: "bg-purple-500",
  site_survey_completed: "bg-purple-600",
  portal_submitted: "bg-indigo-500",
  feasibility_approved: "bg-green-500",
  vendor_assigned: "bg-teal-500",
  installation_scheduled: "bg-orange-500",
  installation_in_progress: "bg-orange-600",
  installation_completed: "bg-green-600",
  inspection_scheduled: "bg-cyan-500",
  inspection_completed: "bg-cyan-600",
  net_meter_installed: "bg-emerald-500",
  subsidy_disbursed: "bg-emerald-600",
  completed: "bg-green-700",
};

export default function CustomerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [step, setStep] = useState<"phone" | "password" | "setup" | "forgot" | "dashboard">("phone");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [hasPassword, setHasPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<InstallationProgress | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("progress");
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [showServiceRequestDialog, setShowServiceRequestDialog] = useState(false);
  const [showTestimonialDialog, setShowTestimonialDialog] = useState(false);
  const [serviceRequestForm, setServiceRequestForm] = useState({
    issueType: "",
    issueTitle: "",
    issueDescription: "",
    urgency: "normal",
  });
  const [testimonialForm, setTestimonialForm] = useState({
    testimonialText: "",
    rating: 5,
  });
  const [testimonialVideo, setTestimonialVideo] = useState<File | null>(null);
  const [testimonialPhotos, setTestimonialPhotos] = useState<File[]>([]);
  const [feedbackRequestId, setFeedbackRequestId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const videoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const siteVideoInputRef = useRef<HTMLInputElement>(null);
  const sitePicturesInputRef = useRef<HTMLInputElement>(null);
  const [sitePictures, setSitePictures] = useState<string[]>([]);
  const [siteVideo, setSiteVideo] = useState<string | null>(null);
  const [customerLocation, setCustomerLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [isUploadingSiteMedia, setIsUploadingSiteMedia] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("customerSessionToken");
    if (token) {
      setSessionToken(token);
      fetchProgress(token);
    }
  }, []);

  const fetchProgress = async (token: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/customer-portal/progress", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.status === 401) {
        localStorage.removeItem("customerSessionToken");
        setSessionToken(null);
        setStep("phone");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch progress");
      }

      const data = await response.json();
      setProgress(data);
      setStep("dashboard");
      fetchServiceRequests(token);
      fetchTestimonials(token);
      fetchSiteMedia(token);
      if (data.customer.latitude && data.customer.longitude) {
        setCustomerLocation({ lat: parseFloat(data.customer.latitude), lng: parseFloat(data.customer.longitude) });
      }
    } catch {
      localStorage.removeItem("customerSessionToken");
      setSessionToken(null);
      setStep("phone");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServiceRequests = async (token: string) => {
    try {
      const response = await fetch("/api/customer-portal/service-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setServiceRequests(data);
      }
    } catch {
      console.error("Failed to fetch service requests");
    }
  };

  const fetchTestimonials = async (token: string) => {
    try {
      const response = await fetch("/api/customer-portal/testimonials", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setTestimonials(data);
      }
    } catch {
      console.error("Failed to fetch testimonials");
    }
  };

  const fetchSiteMedia = async (token: string) => {
    try {
      const response = await fetch("/api/customer-portal/site-media", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSitePictures(data.sitePictures || []);
        setSiteVideo(data.siteVideo || null);
        if (data.latitude && data.longitude) {
          setCustomerLocation({ lat: parseFloat(data.latitude), lng: parseFloat(data.longitude) });
        }
      }
    } catch {
      console.error("Failed to fetch site media");
    }
  };

  const handleCaptureLocation = async () => {
    if (!sessionToken) return;
    
    if (!navigator.geolocation) {
      toast({ title: "Error", description: "Geolocation is not supported by your browser", variant: "destructive" });
      return;
    }

    setIsCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch("/api/customer-portal/location", {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionToken}`,
            },
            body: JSON.stringify({ lat: latitude, lng: longitude }),
          });
          
          if (!response.ok) throw new Error("Failed to save location");
          
          setCustomerLocation({ lat: latitude, lng: longitude });
          toast({ title: "Success", description: "Location captured successfully" });
        } catch {
          toast({ title: "Error", description: "Failed to save location", variant: "destructive" });
        } finally {
          setIsCapturingLocation(false);
        }
      },
      (error) => {
        setIsCapturingLocation(false);
        toast({ title: "Error", description: error.message || "Failed to get location", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  };

  const handleUploadSitePictures = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!sessionToken || !e.target.files?.length) return;
    
    const files = Array.from(e.target.files);
    if (sitePictures.length + files.length > 6) {
      toast({ title: "Error", description: "Maximum 6 pictures allowed", variant: "destructive" });
      return;
    }

    setIsUploadingSiteMedia(true);
    try {
      const formData = new FormData();
      files.forEach(file => formData.append("pictures", file));
      
      const response = await fetch("/api/customer-portal/site-pictures", {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: formData,
      });
      
      if (!response.ok) throw new Error("Failed to upload pictures");
      
      const data = await response.json();
      setSitePictures(data.sitePictures || []);
      toast({ title: "Success", description: "Pictures uploaded successfully" });
    } catch {
      toast({ title: "Error", description: "Failed to upload pictures", variant: "destructive" });
    } finally {
      setIsUploadingSiteMedia(false);
      if (sitePicturesInputRef.current) sitePicturesInputRef.current.value = "";
    }
  };

  const handleUploadSiteVideo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!sessionToken || !e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    if (file.size > 100 * 1024 * 1024) {
      toast({ title: "Error", description: "Video must be less than 100MB", variant: "destructive" });
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = URL.createObjectURL(file);
    await new Promise((resolve) => (video.onloadedmetadata = resolve));
    if (video.duration > 60) {
      toast({ title: "Error", description: "Video must be 60 seconds or less", variant: "destructive" });
      return;
    }

    setIsUploadingSiteMedia(true);
    try {
      const formData = new FormData();
      formData.append("video", file);
      
      const response = await fetch("/api/customer-portal/site-video", {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: formData,
      });
      
      if (!response.ok) throw new Error("Failed to upload video");
      
      const data = await response.json();
      setSiteVideo(data.siteVideo || null);
      toast({ title: "Success", description: "Video uploaded successfully" });
    } catch {
      toast({ title: "Error", description: "Failed to upload video", variant: "destructive" });
    } finally {
      setIsUploadingSiteMedia(false);
      if (siteVideoInputRef.current) siteVideoInputRef.current.value = "";
    }
  };

  const handleDeleteSitePicture = async (index: number) => {
    if (!sessionToken) return;
    
    try {
      const response = await fetch(`/api/customer-portal/site-pictures/${index}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      
      if (!response.ok) throw new Error("Failed to delete picture");
      
      const data = await response.json();
      setSitePictures(data.sitePictures || []);
      toast({ title: "Success", description: "Picture deleted successfully" });
    } catch {
      toast({ title: "Error", description: "Failed to delete picture", variant: "destructive" });
    }
  };

  const handleDeleteSiteVideo = async () => {
    if (!sessionToken) return;
    
    try {
      const response = await fetch("/api/customer-portal/site-video", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      
      if (!response.ok) throw new Error("Failed to delete video");
      
      setSiteVideo(null);
      toast({ title: "Success", description: "Video deleted successfully" });
    } catch {
      toast({ title: "Error", description: "Failed to delete video", variant: "destructive" });
    }
  };

  const handleCreateServiceRequest = async () => {
    if (!sessionToken || !serviceRequestForm.issueType || !serviceRequestForm.issueTitle || !serviceRequestForm.issueDescription) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/customer-portal/service-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(serviceRequestForm),
      });

      if (!response.ok) throw new Error("Failed to create request");

      toast({ title: "Success", description: "Service request submitted successfully" });
      setShowServiceRequestDialog(false);
      setServiceRequestForm({ issueType: "", issueTitle: "", issueDescription: "", urgency: "normal" });
      fetchServiceRequests(sessionToken);
    } catch {
      toast({ title: "Error", description: "Failed to submit service request", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!sessionToken || !feedbackRequestId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/customer-portal/service-requests/${feedbackRequestId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ rating: feedbackRating, feedbackText }),
      });

      if (!response.ok) throw new Error("Failed to submit feedback");

      toast({ title: "Success", description: "Thank you for your feedback!" });
      setFeedbackRequestId(null);
      setFeedbackRating(5);
      setFeedbackText("");
      fetchServiceRequests(sessionToken);
    } catch {
      toast({ title: "Error", description: "Failed to submit feedback", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTestimonial = async () => {
    if (!sessionToken) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("testimonialText", testimonialForm.testimonialText);
      formData.append("rating", testimonialForm.rating.toString());

      if (testimonialVideo) {
        formData.append("video", testimonialVideo);
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = URL.createObjectURL(testimonialVideo);
        await new Promise((resolve) => (video.onloadedmetadata = resolve));
        if (video.duration > 60) {
          toast({ title: "Error", description: "Video must be 60 seconds or less", variant: "destructive" });
          setIsLoading(false);
          return;
        }
        formData.append("videoDuration", Math.round(video.duration).toString());
      }

      testimonialPhotos.forEach((photo) => formData.append("photos", photo));

      const response = await fetch("/api/customer-portal/testimonials", {
        method: "POST",
        headers: { Authorization: `Bearer ${sessionToken}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to create testimonial");

      toast({ title: "Success", description: "Testimonial submitted for review" });
      setShowTestimonialDialog(false);
      setTestimonialForm({ testimonialText: "", rating: 5 });
      setTestimonialVideo(null);
      setTestimonialPhotos([]);
      fetchTestimonials(sessionToken);
    } catch {
      toast({ title: "Error", description: "Failed to submit testimonial", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareTestimonial = async (testimonialId: string, platform: "facebook" | "instagram") => {
    if (!sessionToken) return;

    try {
      await fetch(`/api/customer-portal/testimonials/${testimonialId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ platform }),
      });

      const shareUrl = platform === "facebook" 
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`
        : `https://www.instagram.com/`;
      
      window.open(shareUrl, "_blank");
      fetchTestimonials(sessionToken);
    } catch {
      toast({ title: "Error", description: "Failed to record share", variant: "destructive" });
    }
  };

  const handleCheckPhone = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/customer-portal/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Phone not found");
      }

      setCustomerName(data.customerName);
      setHasPassword(data.hasPassword);
      
      if (data.hasPassword) {
        setStep("password");
      } else {
        setStep("setup");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Phone number not found",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!password) {
      toast({
        title: "Password Required",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/customer-portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("customerSessionToken", data.token);
      setSessionToken(data.token);
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.customer.name}!`,
      });

      fetchProgress(data.token);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupPassword = async () => {
    if (!password || password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/customer-portal/setup-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, confirmPassword }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Setup failed");
      }

      localStorage.setItem("customerSessionToken", data.token);
      setSessionToken(data.token);
      
      toast({
        title: "Password Set Successfully",
        description: "Welcome to your installation dashboard!",
      });

      fetchProgress(data.token);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to set password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestResetOtp = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/customer-portal/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      toast({
        title: "OTP Generated",
        description: data.devOtp 
          ? `Development OTP: ${data.devOtp}` 
          : "Check your phone for the OTP",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to request OTP",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/customer-portal/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, newPassword }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Reset failed");
      }

      toast({
        title: "Password Reset Successfully",
        description: "Please login with your new password",
      });
      
      setPassword("");
      setOtp("");
      setNewPassword("");
      setStep("password");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (sessionToken) {
      try {
        await fetch("/api/customer-portal/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });
      } catch {
        // Ignore logout errors
      }
    }
    localStorage.removeItem("customerSessionToken");
    setSessionToken(null);
    setProgress(null);
    setStep("phone");
    setPhone("");
    setOtp("");
    toast({
      title: "Logged Out",
      description: "You have been logged out successfully",
    });
  };

  if (isLoading && step === "phone") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sun className="h-6 w-6 text-primary" />
            <span className="font-semibold">DivyanshiSolar</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {step === "dashboard" && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/")}
              data-testid="button-home"
            >
              <Home className="h-4 w-4 mr-1" />
              Home
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {step === "phone" && (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                  <Sun className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Track Your Installation</CardTitle>
                <CardDescription>
                  Enter your registered phone number to view your solar installation progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center px-3 bg-muted rounded-md border">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="ml-2 text-sm">+91</span>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleCheckPhone}
                  disabled={isLoading || phone.length !== 10}
                  data-testid="button-continue"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Enter the phone number you registered with your DDP partner
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "password" && (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Welcome Back, {customerName}!</CardTitle>
                <CardDescription>
                  Enter your password to access your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      data-testid="input-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleLogin}
                  disabled={isLoading || !password}
                  data-testid="button-login"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Login
                </Button>
                <div className="flex items-center justify-between gap-2 text-sm">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setPhone("");
                      setPassword("");
                      setStep("phone");
                    }}
                  >
                    Change Number
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setStep("forgot")}
                  >
                    Forgot Password?
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "setup" && (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                  <KeyRound className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Welcome, {customerName}!</CardTitle>
                <CardDescription>
                  Set up a password to access your installation dashboard
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Create Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      data-testid="input-new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    data-testid="input-confirm-password"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleSetupPassword}
                  disabled={isLoading || password.length < 6 || password !== confirmPassword}
                  data-testid="button-setup"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Set Password & Continue
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => {
                    setPhone("");
                    setPassword("");
                    setConfirmPassword("");
                    setStep("phone");
                  }}
                >
                  Use Different Number
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "forgot" && (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Reset Password</CardTitle>
                <CardDescription>
                  Enter the OTP sent to +91 {phone} and set a new password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline"
                  className="w-full" 
                  onClick={handleRequestResetOtp}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Send OTP to Phone
                </Button>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    data-testid="input-otp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-pwd">New Password</Label>
                  <Input
                    id="new-pwd"
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    data-testid="input-new-pwd"
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleResetPassword}
                  disabled={isLoading || otp.length !== 6 || newPassword.length < 6}
                  data-testid="button-reset"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Reset Password
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => {
                    setOtp("");
                    setNewPassword("");
                    setStep("password");
                  }}
                >
                  Back to Login
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {step === "dashboard" && progress && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <User className="h-6 w-6" />
                    Welcome, {progress.customer.name}
                  </h1>
                  {progress.customer.customerCode && (
                    <Badge variant="outline" className="font-mono text-base" data-testid="badge-customer-code">
                      <IdCard className="w-4 h-4 mr-1" />
                      {progress.customer.customerCode}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">
                  Manage your solar installation
                </p>
              </div>
              <Badge className={`${statusColors[progress.customer.status]} text-white`}>
                {statusLabels[progress.customer.status] || progress.customer.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:hidden">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-2"
                onClick={handleCaptureLocation}
                disabled={isCapturingLocation}
                data-testid="mobile-button-location"
              >
                {isCapturingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
                <span className="text-xs">Location</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-2"
                onClick={() => {
                  const text = `Divyanshi Solar Installation Site\n\n${progress.customer.address}, ${progress.customer.district}, ${progress.customer.state} - ${progress.customer.pincode}\n\n${progress.customer.capacity} kW Solar System\n\nwww.divyanshisolar.com`;
                  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(url, "_blank");
                }}
                data-testid="mobile-button-whatsapp"
              >
                <SiWhatsapp className="h-4 w-4 text-green-500" />
                <span className="text-xs">WhatsApp</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-2"
                onClick={() => {
                  const text = `Divyanshi Solar Installation Site - ${progress.customer.address}, ${progress.customer.district}. ${progress.customer.capacity} kW Solar System.`;
                  const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}&u=${encodeURIComponent("https://www.divyanshisolar.com")}`;
                  window.open(url, "_blank");
                }}
                data-testid="mobile-button-facebook"
              >
                <SiFacebook className="h-4 w-4 text-blue-600" />
                <span className="text-xs">Facebook</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center justify-center gap-2"
                onClick={() => setActiveTab("site")}
                data-testid="mobile-button-more"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-xs">More</span>
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="progress" className="flex items-center gap-2" data-testid="tab-progress">
                  <Zap className="h-4 w-4" />
                  <span className="hidden sm:inline">Progress</span>
                </TabsTrigger>
                <TabsTrigger value="site" className="flex items-center gap-2" data-testid="tab-site">
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Site Info</span>
                </TabsTrigger>
                <TabsTrigger value="service" className="flex items-center gap-2" data-testid="tab-service">
                  <Wrench className="h-4 w-4" />
                  <span className="hidden sm:inline">Service</span>
                </TabsTrigger>
                <TabsTrigger value="testimonials" className="flex items-center gap-2" data-testid="tab-testimonials">
                  <MessageSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Reviews</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="progress" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Installation Progress
                    </CardTitle>
                    <CardDescription>
                      Step {progress.currentStep} of {progress.totalSteps}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Overall Progress</span>
                        <span className="font-medium">{progress.percentComplete}%</span>
                      </div>
                      <Progress value={progress.percentComplete} className="h-3" />
                    </div>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Battery className="h-5 w-5" />
                        System Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Capacity</span>
                        <span className="font-medium">{progress.customer.capacity} kW</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Panel Type</span>
                        <span className="font-medium capitalize">{progress.customer.panelType}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Customer Type</span>
                        <span className="font-medium capitalize">{progress.customer.customerType}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subsidy Amount</span>
                        <span className="font-medium text-green-600">
                          {progress.customer.subsidyAmount > 0 
                            ? `Rs ${progress.customer.subsidyAmount.toLocaleString()}`
                            : "Not Applicable"
                          }
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Installation Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm">
                        <p className="font-medium">{progress.customer.address}</p>
                        <p className="text-muted-foreground">
                          {progress.customer.district}, {progress.customer.state}
                        </p>
                        <p className="text-muted-foreground">
                          PIN: {progress.customer.pincode}
                        </p>
                      </div>
                      <Separator />
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Applied on {new Date(progress.customer.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <CardTitle className="text-lg">Installation Journey</CardTitle>
                      <Badge variant={progress.percentComplete === 100 ? "default" : "secondary"}>
                        {progress.milestones.filter(m => m.status === "completed").length} / {installationMilestones.length} Complete
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Track progress for {progress.customer.name}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
                      <div className="space-y-0">
                        {installationMilestones.map((milestone, index) => {
                          const portalData = progress.milestones.find(m => m.title === milestone.key);
                          const isCompleted = portalData?.status === "completed";
                          const completedSoFar = progress.milestones.filter(m => m.status === "completed").length;
                          const isNext = index === completedSoFar;
                          return (
                            <div key={milestone.key} className="relative pl-10 pb-6 last:pb-0">
                              <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${
                                isCompleted ? "bg-green-500 text-white" : isNext ? "bg-primary text-primary-foreground" : "bg-muted border-2 border-muted-foreground/20"
                              }`}>
                                {isCompleted ? <Check className="h-3 w-3" /> : <span className="text-xs font-medium">{index + 1}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className={`font-medium ${isCompleted ? "text-green-700 dark:text-green-400" : ""}`}>
                                    {milestone.label}
                                  </h4>
                                  {isCompleted && (
                                    <Badge variant="outline" className="text-xs text-green-600 border-green-200">Completed</Badge>
                                  )}
                                  {isNext && !isCompleted && (
                                    <Badge variant="outline" className="text-xs">Current</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">{milestone.description}</p>
                                {portalData?.completedAt && (
                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(portalData.completedAt), { addSuffix: true })}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="site" className="space-y-6 mt-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Navigation className="h-5 w-5" />
                        My Location
                      </CardTitle>
                      <CardDescription>
                        Capture your installation site GPS location
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {customerLocation ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-green-500" />
                            <span className="text-muted-foreground">
                              {customerLocation.lat.toFixed(6)}, {customerLocation.lng.toFixed(6)}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`https://www.google.com/maps?q=${customerLocation.lat},${customerLocation.lng}`, "_blank")}
                              data-testid="button-view-map"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View on Map
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleCaptureLocation}
                              disabled={isCapturingLocation}
                              data-testid="button-update-location"
                            >
                              {isCapturingLocation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Navigation className="h-4 w-4 mr-2" />}
                              Update Location
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            No location captured yet. Please capture your installation site location.
                          </p>
                          <Button
                            onClick={handleCaptureLocation}
                            disabled={isCapturingLocation}
                            data-testid="button-capture-location"
                          >
                            {isCapturingLocation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Navigation className="h-4 w-4 mr-2" />}
                            Capture Location
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Site Pictures
                      </CardTitle>
                      <CardDescription>
                        Upload up to 6 pictures of your installation site
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {sitePictures.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {sitePictures.map((pic, index) => (
                            <div key={index} className="relative group aspect-square">
                              <img 
                                src={pic} 
                                alt={`Site ${index + 1}`} 
                                className="w-full h-full object-cover rounded-md"
                              />
                              <Button
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteSitePicture(index)}
                                data-testid={`button-delete-picture-${index}`}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No pictures uploaded yet</p>
                      )}
                      {sitePictures.length < 6 && (
                        <div>
                          <input
                            ref={sitePicturesInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleUploadSitePictures}
                          />
                          <Button
                            variant="outline"
                            onClick={() => sitePicturesInputRef.current?.click()}
                            disabled={isUploadingSiteMedia}
                            data-testid="button-upload-pictures"
                          >
                            {isUploadingSiteMedia ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            Upload Pictures ({sitePictures.length}/6)
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Site Video
                    </CardTitle>
                    <CardDescription>
                      Upload a video of your installation site (max 60 seconds, 9:16 format recommended)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {siteVideo ? (
                      <div className="space-y-3">
                        <video 
                          src={siteVideo} 
                          controls 
                          className="max-w-sm rounded-md"
                          style={{ maxHeight: "300px" }}
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteSiteVideo}
                          data-testid="button-delete-video"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Delete Video
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">No video uploaded yet</p>
                        <input
                          ref={siteVideoInputRef}
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={handleUploadSiteVideo}
                        />
                        <Button
                          variant="outline"
                          onClick={() => siteVideoInputRef.current?.click()}
                          disabled={isUploadingSiteMedia}
                          data-testid="button-upload-video"
                        >
                          {isUploadingSiteMedia ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Video className="h-4 w-4 mr-2" />}
                          Upload Video
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Share2 className="h-5 w-5" />
                      Share on Social Media
                    </CardTitle>
                    <CardDescription>
                      Share your Divyanshi Solar installation with friends and family
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <p className="font-semibold text-primary">Divyanshi Solar Installation Site</p>
                      <p className="text-sm text-muted-foreground">
                        {progress.customer.address}, {progress.customer.district}, {progress.customer.state} - {progress.customer.pincode}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {progress.customer.capacity} kW Solar System | {progress.customer.panelType?.toUpperCase()} Panels
                      </p>
                      <p className="text-xs text-primary mt-2">www.divyanshisolar.com</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 min-w-[120px]"
                        onClick={() => {
                          const text = `Divyanshi Solar Installation Site\n\n${progress.customer.address}, ${progress.customer.district}, ${progress.customer.state} - ${progress.customer.pincode}\n\n${progress.customer.capacity} kW Solar System | ${progress.customer.panelType?.toUpperCase()} Panels\n\nPowered by Divyanshi Solar\nwww.divyanshisolar.com`;
                          const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                          window.open(url, "_blank");
                        }}
                        data-testid="button-share-whatsapp"
                      >
                        <SiWhatsapp className="h-4 w-4 mr-2 text-green-500" />
                        WhatsApp
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 min-w-[120px]"
                        onClick={() => {
                          const text = `Divyanshi Solar Installation Site - ${progress.customer.address}, ${progress.customer.district}, ${progress.customer.state}. ${progress.customer.capacity} kW Solar System. www.divyanshisolar.com`;
                          const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}&u=${encodeURIComponent("https://www.divyanshisolar.com")}`;
                          window.open(url, "_blank");
                        }}
                        data-testid="button-share-facebook"
                      >
                        <SiFacebook className="h-4 w-4 mr-2 text-blue-600" />
                        Facebook
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 min-w-[120px]"
                        onClick={() => {
                          const text = `Divyanshi Solar Installation Site - ${progress.customer.address}, ${progress.customer.district}. ${progress.customer.capacity} kW Solar System. #DivyanshiSolar #SolarEnergy #PMSuryaGhar`;
                          const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://www.divyanshisolar.com")}`;
                          window.open(url, "_blank");
                        }}
                        data-testid="button-share-twitter"
                      >
                        <SiX className="h-4 w-4 mr-2" />
                        X (Twitter)
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 min-w-[120px]"
                        onClick={() => {
                          window.open("https://www.instagram.com/", "_blank");
                          toast({ 
                            title: "Copy & Share", 
                            description: "Open Instagram and paste your story with: Divyanshi Solar Installation - " + progress.customer.address 
                          });
                        }}
                        data-testid="button-share-instagram"
                      >
                        <SiInstagram className="h-4 w-4 mr-2 text-pink-500" />
                        Instagram
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      All shared content will include Divyanshi Solar branding and your installation address
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="service" className="space-y-6 mt-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-lg font-semibold">Service Requests</h2>
                    <p className="text-sm text-muted-foreground">Report issues with your installation</p>
                  </div>
                  <Dialog open={showServiceRequestDialog} onOpenChange={setShowServiceRequestDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-new-service-request">
                        <Plus className="h-4 w-4 mr-2" />
                        Raise Request
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Raise Service Request</DialogTitle>
                        <DialogDescription>
                          Describe your issue and we will assign a technician
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Issue Type</Label>
                          <Select
                            value={serviceRequestForm.issueType}
                            onValueChange={(value) => setServiceRequestForm(prev => ({ ...prev, issueType: value }))}
                          >
                            <SelectTrigger data-testid="select-issue-type">
                              <SelectValue placeholder="Select issue type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="electrical">Electrical Issue</SelectItem>
                              <SelectItem value="inverter">Inverter Problem</SelectItem>
                              <SelectItem value="power_generation">Power Generation Issue</SelectItem>
                              <SelectItem value="panel_damage">Panel Damage</SelectItem>
                              <SelectItem value="wiring">Wiring Problem</SelectItem>
                              <SelectItem value="meter">Meter Issue</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Issue Title</Label>
                          <Input
                            placeholder="Brief title for your issue"
                            value={serviceRequestForm.issueTitle}
                            onChange={(e) => setServiceRequestForm(prev => ({ ...prev, issueTitle: e.target.value }))}
                            data-testid="input-issue-title"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description</Label>
                          <Textarea
                            placeholder="Describe your issue in detail..."
                            value={serviceRequestForm.issueDescription}
                            onChange={(e) => setServiceRequestForm(prev => ({ ...prev, issueDescription: e.target.value }))}
                            rows={4}
                            data-testid="input-issue-description"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Urgency</Label>
                          <Select
                            value={serviceRequestForm.urgency}
                            onValueChange={(value) => setServiceRequestForm(prev => ({ ...prev, urgency: value }))}
                          >
                            <SelectTrigger data-testid="select-urgency">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low - Can wait a few days</SelectItem>
                              <SelectItem value="normal">Normal - Within a week</SelectItem>
                              <SelectItem value="high">High - Urgent attention needed</SelectItem>
                              <SelectItem value="critical">Critical - System not working</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          className="w-full"
                          onClick={handleCreateServiceRequest}
                          disabled={isLoading || !serviceRequestForm.issueType || !serviceRequestForm.issueTitle}
                          data-testid="button-submit-service-request"
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Submit Request
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {serviceRequests.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-medium">No Service Requests</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        You have not raised any service requests yet
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {serviceRequests.map((request) => (
                      <Card key={request.id} data-testid={`service-request-${request.id}`}>
                        <CardContent className="pt-6">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline">{request.requestNumber}</Badge>
                                <Badge className={`${serviceStatusColors[request.status]} text-white`}>
                                  {request.status.replace(/_/g, " ")}
                                </Badge>
                                <Badge variant="secondary">{issueTypeLabels[request.issueType]}</Badge>
                              </div>
                              <h4 className="font-medium">{request.issueTitle}</h4>
                              <p className="text-sm text-muted-foreground">{request.issueDescription}</p>
                              <p className="text-xs text-muted-foreground">
                                Created: {new Date(request.createdAt).toLocaleDateString("en-IN")}
                              </p>
                              {request.resolutionNotes && (
                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                                  <p className="text-sm font-medium text-green-700 dark:text-green-400">Resolution:</p>
                                  <p className="text-sm text-green-600 dark:text-green-300">{request.resolutionNotes}</p>
                                </div>
                              )}
                            </div>
                            {request.status === "resolved" && !request.customerFeedbackRating && (
                              <Dialog open={feedbackRequestId === request.id} onOpenChange={(open) => !open && setFeedbackRequestId(null)}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" onClick={() => setFeedbackRequestId(request.id)} data-testid={`button-feedback-${request.id}`}>
                                    <ThumbsUp className="h-4 w-4 mr-2" />
                                    Give Feedback
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Rate Service</DialogTitle>
                                    <DialogDescription>How was your service experience?</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label>Rating</Label>
                                      <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Button
                                            key={star}
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setFeedbackRating(star)}
                                            className={feedbackRating >= star ? "text-yellow-500" : "text-muted-foreground"}
                                          >
                                            <Star className="h-6 w-6" fill={feedbackRating >= star ? "currentColor" : "none"} />
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Comments (Optional)</Label>
                                      <Textarea
                                        placeholder="Share your experience..."
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        rows={3}
                                      />
                                    </div>
                                    <Button className="w-full" onClick={handleSubmitFeedback} disabled={isLoading}>
                                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                      Submit Feedback
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                            {request.customerFeedbackRating && (
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${i < request.customerFeedbackRating! ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="testimonials" className="space-y-6 mt-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="text-lg font-semibold">Your Testimonials</h2>
                    <p className="text-sm text-muted-foreground">Share your solar experience</p>
                  </div>
                  <Dialog open={showTestimonialDialog} onOpenChange={setShowTestimonialDialog}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-new-testimonial">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Testimonial
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Share Your Experience</DialogTitle>
                        <DialogDescription>
                          Tell us about your solar journey. Videos must be 60 seconds or less.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Rating</Label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Button
                                key={star}
                                variant="ghost"
                                size="icon"
                                onClick={() => setTestimonialForm(prev => ({ ...prev, rating: star }))}
                                className={testimonialForm.rating >= star ? "text-yellow-500" : "text-muted-foreground"}
                              >
                                <Star className="h-6 w-6" fill={testimonialForm.rating >= star ? "currentColor" : "none"} />
                              </Button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Your Story</Label>
                          <Textarea
                            placeholder="Share your experience with solar installation..."
                            value={testimonialForm.testimonialText}
                            onChange={(e) => setTestimonialForm(prev => ({ ...prev, testimonialText: e.target.value }))}
                            rows={4}
                            data-testid="input-testimonial-text"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Video (Optional, max 60 seconds)</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept="video/*"
                              ref={videoInputRef}
                              className="hidden"
                              onChange={(e) => e.target.files?.[0] && setTestimonialVideo(e.target.files[0])}
                            />
                            <Button
                              variant="outline"
                              onClick={() => videoInputRef.current?.click()}
                              data-testid="button-upload-video"
                            >
                              <Video className="h-4 w-4 mr-2" />
                              {testimonialVideo ? testimonialVideo.name : "Upload Video"}
                            </Button>
                            {testimonialVideo && (
                              <Button variant="ghost" size="icon" onClick={() => setTestimonialVideo(null)}>
                                <AlertCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Photos of Your Installation (Optional)</Label>
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              ref={photoInputRef}
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files) {
                                  setTestimonialPhotos(prev => [...prev, ...Array.from(e.target.files!)].slice(0, 6));
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              onClick={() => photoInputRef.current?.click()}
                              disabled={testimonialPhotos.length >= 6}
                              data-testid="button-upload-photos"
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              Add Photos ({testimonialPhotos.length}/6)
                            </Button>
                          </div>
                          {testimonialPhotos.length > 0 && (
                            <div className="flex gap-2 flex-wrap mt-2">
                              {testimonialPhotos.map((photo, idx) => (
                                <div key={idx} className="relative">
                                  <img
                                    src={URL.createObjectURL(photo)}
                                    alt={`Photo ${idx + 1}`}
                                    className="w-16 h-16 object-cover rounded-md"
                                  />
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-5 w-5"
                                    onClick={() => setTestimonialPhotos(prev => prev.filter((_, i) => i !== idx))}
                                  >
                                    <AlertCircle className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          className="w-full"
                          onClick={handleCreateTestimonial}
                          disabled={isLoading || (!testimonialForm.testimonialText && !testimonialVideo)}
                          data-testid="button-submit-testimonial"
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                          Submit Testimonial
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {testimonials.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="font-medium">No Testimonials Yet</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Share your solar experience with others
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {testimonials.map((testimonial) => (
                      <Card key={testimonial.id} data-testid={`testimonial-${testimonial.id}`}>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                              <div className="flex items-center gap-2">
                                <Badge variant={testimonial.status === "approved" ? "default" : testimonial.status === "pending" ? "secondary" : "destructive"}>
                                  {testimonial.status}
                                </Badge>
                                {testimonial.rating && (
                                  <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${i < testimonial.rating! ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground"}`}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {new Date(testimonial.createdAt).toLocaleDateString("en-IN")}
                              </p>
                            </div>
                            {testimonial.testimonialText && (
                              <p className="text-sm">{testimonial.testimonialText}</p>
                            )}
                            {testimonial.videoUrl && (
                              <div className="relative rounded-md overflow-hidden bg-black/5">
                                <video
                                  src={testimonial.videoUrl}
                                  controls
                                  className="w-full max-h-64"
                                />
                              </div>
                            )}
                            {testimonial.plantPhotos && testimonial.plantPhotos.length > 0 && (
                              <div className="flex gap-2 flex-wrap">
                                {testimonial.plantPhotos.map((photo, idx) => (
                                  <img
                                    key={idx}
                                    src={photo}
                                    alt={`Plant photo ${idx + 1}`}
                                    className="w-24 h-24 object-cover rounded-md"
                                  />
                                ))}
                              </div>
                            )}
                            {testimonial.status === "approved" && (
                              <div className="flex gap-2 flex-wrap pt-2 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleShareTestimonial(testimonial.id, "facebook")}
                                  disabled={testimonial.sharedOnFacebook || false}
                                  data-testid={`button-share-facebook-${testimonial.id}`}
                                >
                                  <SiFacebook className="h-4 w-4 mr-2" />
                                  {testimonial.sharedOnFacebook ? "Shared" : "Share on Facebook"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleShareTestimonial(testimonial.id, "instagram")}
                                  disabled={testimonial.sharedOnInstagram || false}
                                  data-testid={`button-share-instagram-${testimonial.id}`}
                                >
                                  <SiInstagram className="h-4 w-4 mr-2" />
                                  {testimonial.sharedOnInstagram ? "Shared" : "Share on Instagram"}
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Need Help?</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Contact our support team for any queries about your installation
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                      <a 
                        href="tel:9801005212" 
                        className="text-sm text-primary hover:underline"
                        data-testid="contact-chandrakant"
                      >
                        Chandrakant Akela - 9801005212
                      </a>
                      <a 
                        href="tel:8709248597" 
                        className="text-sm text-primary hover:underline"
                        data-testid="contact-abhijeet"
                      >
                        Abhijeet Chauhan - 8709248597
                      </a>
                      <a 
                        href="tel:8777684575" 
                        className="text-sm text-primary hover:underline"
                        data-testid="contact-sanjay"
                      >
                        Sanjay Kumar - 8777684575
                      </a>
                      <a 
                        href="tel:9123141987" 
                        className="text-sm text-primary hover:underline"
                        data-testid="contact-anil"
                      >
                        Anil Kumar - 9123141987
                      </a>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
