import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  MoreVertical, 
  Download, 
  Trash2, 
  CheckCircle, 
  Clock,
  Eye,
  Shield,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";

export const DOCUMENT_CATEGORIES = [
  { value: "customer_id", label: "Customer ID Proof" },
  { value: "address_proof", label: "Address Proof" },
  { value: "electricity_bill", label: "Electricity Bill" },
  { value: "site_survey", label: "Site Survey" },
  { value: "installation_photo", label: "Installation Photos" },
  { value: "completion_certificate", label: "Completion Certificate" },
  { value: "subsidy_document", label: "Subsidy Documents" },
  { value: "invoice", label: "Invoice" },
  { value: "agreement", label: "Agreement/Contract" },
  { value: "bank_document", label: "Bank Documents" },
  { value: "other", label: "Other" },
] as const;

interface Document {
  id: string;
  name: string;
  originalName: string;
  category: string;
  mimeType: string;
  size: number;
  url: string;
  customerId?: string;
  partnerId?: string;
  uploadedById: string;
  uploadedByRole: string;
  description?: string;
  isVerified: boolean;
  verifiedById?: string;
  verifiedAt?: string;
  expiresAt?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface DocumentManagerProps {
  customerId?: string;
  partnerId?: string;
  showUpload?: boolean;
  canVerify?: boolean;
  title?: string;
}

export function DocumentManager({ 
  customerId, 
  partnerId, 
  showUpload = true,
  canVerify = false,
  title = "Documents"
}: DocumentManagerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const queryKey = customerId 
    ? ["/api/documents/customer", customerId]
    : partnerId 
    ? ["/api/documents/partner", partnerId]
    : ["/api/documents"];

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey,
    queryFn: async () => {
      const url = customerId 
        ? `/api/documents/customer/${customerId}`
        : partnerId 
        ? `/api/documents/partner/${partnerId}`
        : "/api/documents";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch documents");
      return res.json();
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setIsUploadOpen(false);
      setSelectedFile(null);
      setSelectedCategory("");
      setDescription("");
      toast({ title: "Document uploaded successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/documents/${id}/verify`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Document verified successfully" });
    },
    onError: () => {
      toast({ title: "Verification failed", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Document deleted successfully" });
    },
    onError: () => {
      toast({ title: "Delete failed", variant: "destructive" });
    },
  });

  const handleUpload = () => {
    if (!selectedFile || !selectedCategory) {
      toast({ title: "Please select a file and category", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("category", selectedCategory);
    if (description) formData.append("description", description);
    if (customerId) formData.append("customerId", customerId);
    if (partnerId) formData.append("partnerId", partnerId);

    uploadMutation.mutate(formData);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <Image className="h-5 w-5" />;
    if (mimeType === "application/pdf") return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getCategoryLabel = (value: string) => {
    return DOCUMENT_CATEGORIES.find(c => c.value === value)?.label || value;
  };

  const filteredDocuments = filterCategory === "all" 
    ? documents 
    : documents.filter(d => d.category === filterCategory);

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            {documents.length} document{documents.length !== 1 ? "s" : ""} uploaded
          </CardDescription>
        </div>
        {showUpload && (
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-upload-document">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Upload a document for record-keeping and compliance.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger data-testid="select-document-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>File *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                      data-testid="input-document-file"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Accepted: Images (JPG, PNG), PDF, Word, Excel. Max 10MB.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add notes about this document..."
                    data-testid="input-document-description"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsUploadOpen(false)}
                  data-testid="button-cancel-upload"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpload} 
                  disabled={uploadMutation.isPending || !selectedFile || !selectedCategory}
                  data-testid="button-confirm-upload"
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[200px]" data-testid="select-filter-category">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {DOCUMENT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading documents...</div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No documents found. {showUpload && "Click Upload to add documents."}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between p-3 border rounded-md hover-elevate"
                data-testid={`document-row-${doc.id}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-muted rounded-md">
                    {getFileIcon(doc.mimeType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate" title={doc.originalName}>
                        {doc.originalName}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {getCategoryLabel(doc.category)}
                      </Badge>
                      {doc.isVerified ? (
                        <Badge variant="default" className="text-xs gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs gap-1">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                      )}
                      {isExpired(doc.expiresAt) && (
                        <Badge variant="destructive" className="text-xs gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Expired
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{formatFileSize(doc.size)}</span>
                      <span className="hidden sm:inline">
                        Uploaded {format(new Date(doc.createdAt), "MMM d, yyyy")}
                      </span>
                    </div>
                    {doc.description && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {doc.description}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid={`button-document-menu-${doc.id}`}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <a 
                        href={doc.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                        data-testid={`button-view-document-${doc.id}`}
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a 
                        href={doc.url} 
                        download={doc.originalName}
                        className="flex items-center gap-2"
                        data-testid={`button-download-document-${doc.id}`}
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </DropdownMenuItem>
                    {canVerify && !doc.isVerified && (
                      <DropdownMenuItem 
                        onClick={() => verifyMutation.mutate(doc.id)}
                        className="flex items-center gap-2"
                        data-testid={`button-verify-document-${doc.id}`}
                      >
                        <Shield className="h-4 w-4" />
                        Verify
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => deleteMutation.mutate(doc.id)}
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                      data-testid={`button-delete-document-${doc.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
