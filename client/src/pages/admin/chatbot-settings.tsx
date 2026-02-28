import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bot, Plus, Pencil, Trash2, Video, FileText, Image, GripVertical, Eye, EyeOff, Copy, ExternalLink, Link } from "lucide-react";

interface ChatbotNode {
  id: string;
  stepId: string;
  labelEn: string;
  labelHi: string;
  messageEn: string;
  messageHi: string;
  inputType: string;
  options: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  mediaTitle: string | null;
  savesField: string | null;
  sortOrder: number;
  isActive: boolean;
}

const INPUT_TYPES = [
  { value: "text", label: "Text Input" },
  { value: "buttons", label: "Buttons" },
  { value: "dropdown", label: "Dropdown" },
  { value: "location", label: "GPS Location" },
  { value: "none", label: "No Input (Message Only)" },
];

const MEDIA_TYPES = [
  { value: "", label: "None" },
  { value: "video", label: "Video (YouTube/URL)" },
  { value: "ppt", label: "PPT / Document" },
  { value: "image", label: "Image" },
  { value: "pdf", label: "PDF" },
];

const defaultNode: Partial<ChatbotNode> = {
  stepId: "",
  labelEn: "",
  labelHi: "",
  messageEn: "",
  messageHi: "",
  inputType: "text",
  options: "",
  mediaType: "",
  mediaUrl: "",
  mediaTitle: "",
  savesField: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminChatbotSettings() {
  const { toast } = useToast();
  const [editNode, setEditNode] = useState<Partial<ChatbotNode> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sharecopied, setShareCopied] = useState(false);

  const { data: nodes = [], isLoading } = useQuery<ChatbotNode[]>({
    queryKey: ["/api/admin/chatbot-nodes"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<ChatbotNode>) => {
      const res = await apiRequest("POST", "/api/admin/chatbot-nodes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot-nodes"] });
      setIsDialogOpen(false);
      setEditNode(null);
      toast({ title: "Node created successfully" });
    },
    onError: (err: any) => toast({ title: "Failed to create node", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<ChatbotNode>) => {
      const res = await apiRequest("PUT", `/api/admin/chatbot-nodes/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot-nodes"] });
      setIsDialogOpen(false);
      setEditNode(null);
      toast({ title: "Node updated successfully" });
    },
    onError: (err: any) => toast({ title: "Failed to update node", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/chatbot-nodes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot-nodes"] });
      toast({ title: "Node deleted" });
    },
    onError: (err: any) => toast({ title: "Failed to delete", description: err.message, variant: "destructive" }),
  });

  const handleSave = () => {
    if (!editNode) return;
    if (!editNode.stepId || !editNode.labelEn || !editNode.messageEn) {
      toast({ title: "Step ID, Label, and Message are required", variant: "destructive" });
      return;
    }
    if (editNode.id) {
      updateMutation.mutate(editNode);
    } else {
      createMutation.mutate(editNode);
    }
  };

  const openAdd = () => {
    const maxSort = nodes.length > 0 ? Math.max(...nodes.map(n => n.sortOrder)) + 1 : 0;
    setEditNode({ ...defaultNode, sortOrder: maxSort });
    setIsDialogOpen(true);
  };

  const openEdit = (node: ChatbotNode) => {
    setEditNode({ ...node });
    setIsDialogOpen(true);
  };

  const shareLink = `${window.location.origin}/solar-bot`;

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const getMediaIcon = (type: string | null) => {
    switch (type) {
      case "video": return <Video size={14} className="text-red-500" />;
      case "ppt": return <FileText size={14} className="text-orange-500" />;
      case "image": return <Image size={14} className="text-blue-500" />;
      case "pdf": return <FileText size={14} className="text-red-600" />;
      default: return null;
    }
  };

  const getInputBadge = (type: string) => {
    const colors: Record<string, string> = {
      text: "bg-blue-100 text-blue-700",
      buttons: "bg-green-100 text-green-700",
      dropdown: "bg-purple-100 text-purple-700",
      location: "bg-orange-100 text-orange-700",
      none: "bg-gray-100 text-gray-600",
    };
    return <Badge className={`text-[10px] px-1.5 py-0 ${colors[type] || "bg-gray-100"}`}>{type}</Badge>;
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
            <Bot className="text-green-600" /> Chatbot Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage chatbot flow nodes, messages, and media attachments</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleCopyShareLink} data-testid="button-copy-share-link">
            {sharecopied ? <><Copy size={14} className="mr-1" /> Copied!</> : <><Link size={14} className="mr-1" /> Copy Bot Link</>}
          </Button>
          <a href="/solar-bot" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" data-testid="button-preview-bot">
              <ExternalLink size={14} className="mr-1" /> Preview Bot
            </Button>
          </a>
          <Button onClick={openAdd} size="sm" data-testid="button-add-node">
            <Plus size={14} className="mr-1" /> Add Node
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Shareable Bot Link</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950 p-3 rounded-lg border border-green-200 dark:border-green-800">
            <Link size={16} className="text-green-600 flex-shrink-0" />
            <code className="text-sm flex-1 break-all text-green-700 dark:text-green-300" data-testid="text-share-link">{shareLink}</code>
            <Button variant="ghost" size="sm" onClick={handleCopyShareLink} data-testid="button-copy-link-2">
              <Copy size={14} />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Share this link with anyone. When they open it, the chatbot will capture their data in Solar Bot Leads.</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-10 text-muted-foreground">Loading chatbot nodes...</div>
      ) : (
        <div className="space-y-2">
          {nodes.map((node, idx) => (
            <Card key={node.id} className={`transition-all ${!node.isActive ? 'opacity-50' : ''}`} data-testid={`card-node-${node.stepId}`}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <GripVertical size={16} className="text-muted-foreground" />
                    <span className="text-xs font-mono text-muted-foreground">{idx + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-semibold text-sm" data-testid={`text-node-label-${node.stepId}`}>{node.labelEn}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono">Step {node.stepId}</Badge>
                      {getInputBadge(node.inputType)}
                      {node.mediaType && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex items-center gap-1">
                          {getMediaIcon(node.mediaType)} {node.mediaType.toUpperCase()}
                        </Badge>
                      )}
                      {!node.isActive && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Disabled</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">{node.messageEn}</p>
                    {node.options && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {node.options.split(",").slice(0, 5).map(opt => (
                          <Badge key={opt} variant="outline" className="text-[10px] px-1 py-0">{opt.trim()}</Badge>
                        ))}
                        {node.options.split(",").length > 5 && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">+{node.options.split(",").length - 5} more</Badge>
                        )}
                      </div>
                    )}
                    {node.mediaUrl && (
                      <div className="mt-1.5 flex items-center gap-1">
                        {getMediaIcon(node.mediaType)}
                        <a href={node.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline truncate max-w-[250px]">
                          {node.mediaTitle || node.mediaUrl}
                        </a>
                      </div>
                    )}
                    {node.savesField && (
                      <p className="text-[10px] text-muted-foreground mt-1">Saves to: <code className="bg-muted px-1 rounded">{node.savesField}</code></p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(node)} data-testid={`button-edit-${node.stepId}`}>
                      <Pencil size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                      if (confirm(`Delete node "${node.labelEn}" (Step ${node.stepId})?`)) deleteMutation.mutate(node.id);
                    }} data-testid={`button-delete-${node.stepId}`}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {nodes.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No chatbot nodes configured. Click "Add Node" to create one.
            </div>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) setEditNode(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editNode?.id ? "Edit Node" : "Add New Node"}</DialogTitle>
          </DialogHeader>
          {editNode && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Step ID *</Label>
                  <Input value={editNode.stepId || ""} onChange={e => setEditNode({...editNode, stepId: e.target.value})} placeholder="e.g. 1, 1.1, 2" data-testid="input-step-id" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Unique identifier for this step</p>
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input type="number" value={editNode.sortOrder || 0} onChange={e => setEditNode({...editNode, sortOrder: parseInt(e.target.value) || 0})} data-testid="input-sort-order" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Label (English) *</Label>
                  <Input value={editNode.labelEn || ""} onChange={e => setEditNode({...editNode, labelEn: e.target.value})} placeholder="e.g. Customer Name" data-testid="input-label-en" />
                </div>
                <div>
                  <Label>Label (Hindi)</Label>
                  <Input value={editNode.labelHi || ""} onChange={e => setEditNode({...editNode, labelHi: e.target.value})} placeholder="e.g. ग्राहक का नाम" data-testid="input-label-hi" />
                </div>
              </div>

              <div>
                <Label>Bot Message (English) *</Label>
                <Textarea rows={3} value={editNode.messageEn || ""} onChange={e => setEditNode({...editNode, messageEn: e.target.value})} placeholder="The message the bot will display..." data-testid="input-message-en" />
              </div>

              <div>
                <Label>Bot Message (Hindi)</Label>
                <Textarea rows={3} value={editNode.messageHi || ""} onChange={e => setEditNode({...editNode, messageHi: e.target.value})} placeholder="हिंदी में संदेश..." data-testid="input-message-hi" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Input Type</Label>
                  <Select value={editNode.inputType || "text"} onValueChange={v => setEditNode({...editNode, inputType: v})}>
                    <SelectTrigger data-testid="select-input-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INPUT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Saves To Field</Label>
                  <Input value={editNode.savesField || ""} onChange={e => setEditNode({...editNode, savesField: e.target.value})} placeholder="e.g. name, email, state" data-testid="input-saves-field" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Lead field to save user response</p>
                </div>
              </div>

              {(editNode.inputType === "buttons" || editNode.inputType === "dropdown") && (
                <div>
                  <Label>Options (comma-separated)</Label>
                  <Textarea rows={2} value={editNode.options || ""} onChange={e => setEditNode({...editNode, options: e.target.value})} placeholder="Option 1, Option 2, Option 3" data-testid="input-options" />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Separate options with commas</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Video size={16} className="text-red-500" /> Media Attachment
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Media Type</Label>
                    <Select value={editNode.mediaType || ""} onValueChange={v => setEditNode({...editNode, mediaType: v || null})}>
                      <SelectTrigger data-testid="select-media-type"><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        {MEDIA_TYPES.map(t => <SelectItem key={t.value || "none"} value={t.value || "none"}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Media Title</Label>
                    <Input value={editNode.mediaTitle || ""} onChange={e => setEditNode({...editNode, mediaTitle: e.target.value})} placeholder="e.g. Solar Installation Guide" data-testid="input-media-title" />
                  </div>
                </div>
                {editNode.mediaType && editNode.mediaType !== "none" && (
                  <div className="mt-3">
                    <Label>Media URL *</Label>
                    <Input value={editNode.mediaUrl || ""} onChange={e => setEditNode({...editNode, mediaUrl: e.target.value})} placeholder="https://..." data-testid="input-media-url" />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {editNode.mediaType === "video" ? "YouTube link or direct video URL" :
                       editNode.mediaType === "ppt" ? "Google Slides link or direct PPT URL" :
                       "Direct link to the file"}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 border-t pt-4">
                <Switch checked={editNode.isActive !== false} onCheckedChange={v => setEditNode({...editNode, isActive: v})} data-testid="switch-active" />
                <Label className="flex items-center gap-1.5">
                  {editNode.isActive !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                  {editNode.isActive !== false ? "Active" : "Disabled"}
                </Label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditNode(null); }} data-testid="button-cancel">Cancel</Button>
                <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-node">
                  {(createMutation.isPending || updateMutation.isPending) ? "Saving..." : "Save Node"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
