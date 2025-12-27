import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MessageSquare,
  Mail,
  Smartphone,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Send,
  Bell,
  Users,
  Megaphone,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { NotificationTemplate } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

export default function NotificationSettingsPage() {
  const { toast } = useToast();
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [showBroadcastDialog, setShowBroadcastDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testMessage, setTestMessage] = useState("Test notification from Divyanshi Solar");
  
  // Broadcast state
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastSendWhatsApp, setBroadcastSendWhatsApp] = useState(true);
  const [broadcastSendEmail, setBroadcastSendEmail] = useState(true);
  const [broadcastPartnerType, setBroadcastPartnerType] = useState("all");

  const { data: config, isLoading: configLoading } = useQuery<{
    whatsapp: boolean;
    sms: boolean;
    email: boolean;
    message: string;
  }>({
    queryKey: ["/api/admin/notification-config"],
  });

  const { data: templates, isLoading: templatesLoading } = useQuery<NotificationTemplate[]>({
    queryKey: ["/api/admin/notification-templates"],
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/notification-templates", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-templates"] });
      setShowTemplateDialog(false);
      setEditingTemplate(null);
      toast({ title: "Template created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/admin/notification-templates/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-templates"] });
      setShowTemplateDialog(false);
      setEditingTemplate(null);
      toast({ title: "Template updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update template", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/notification-templates/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notification-templates"] });
      toast({ title: "Template deleted" });
    },
  });

  const testNotificationMutation = useMutation({
    mutationFn: (data: { phone?: string; email?: string; message: string }) =>
      apiRequest("/api/admin/test-notification", "POST", data),
    onSuccess: () => {
      setShowTestDialog(false);
      toast({ title: "Test notification sent!" });
    },
    onError: () => {
      toast({ title: "Failed to send test notification", variant: "destructive" });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: (data: { subject: string; message: string; sendWhatsApp: boolean; sendEmail: boolean; partnerType: string }) =>
      apiRequest("/api/admin/broadcast-partners", "POST", data),
    onSuccess: (data: any) => {
      setShowBroadcastDialog(false);
      setBroadcastSubject("");
      setBroadcastMessage("");
      const results = data.results;
      toast({ 
        title: "Broadcast sent successfully!", 
        description: `WhatsApp: ${results.whatsapp.sent} sent, ${results.whatsapp.failed} failed. Email: ${results.email.sent} sent, ${results.email.failed} failed.`
      });
    },
    onError: () => {
      toast({ title: "Failed to send broadcast", variant: "destructive" });
    },
  });

  const [formData, setFormData] = useState({
    name: "",
    trigger: "status_change",
    triggerValue: "",
    channel: "sms",
    subject: "",
    template: "",
    isActive: "true",
  });

  const openEditDialog = (tpl: NotificationTemplate) => {
    setEditingTemplate(tpl);
    setFormData({
      name: tpl.name,
      trigger: tpl.trigger,
      triggerValue: tpl.triggerValue || "",
      channel: tpl.channel,
      subject: tpl.subject || "",
      template: tpl.template,
      isActive: tpl.isActive || "true",
    });
    setShowTemplateDialog(true);
  };

  const openNewDialog = () => {
    setEditingTemplate(null);
    setFormData({
      name: "",
      trigger: "status_change",
      triggerValue: "",
      channel: "sms",
      subject: "",
      template: "",
      isActive: "true",
    });
    setShowTemplateDialog(true);
  };

  const handleSubmit = () => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data: formData });
    } else {
      createTemplateMutation.mutate(formData);
    }
  };

  const channelIcons: Record<string, any> = {
    sms: Smartphone,
    email: Mail,
    whatsapp: MessageSquare,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Notification Settings</h1>
          <p className="text-muted-foreground">
            Configure SMS, Email, and WhatsApp notifications
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => setShowBroadcastDialog(true)} data-testid="button-broadcast-partners">
            <Megaphone className="w-4 h-4 mr-2" />
            Broadcast to Partners
          </Button>
          <Button variant="outline" onClick={() => setShowTestDialog(true)} data-testid="button-test-notification">
            <Send className="w-4 h-4 mr-2" />
            Test Notification
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Twilio API</p>
                </div>
              </div>
              {configLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : config?.whatsapp ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  <XCircle className="w-3 h-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium">SMS</p>
                  <p className="text-xs text-muted-foreground">Twilio API</p>
                </div>
              </div>
              {configLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : config?.sms ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  <XCircle className="w-3 h-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">Resend API</p>
                </div>
              </div>
              {configLoading ? (
                <Skeleton className="h-6 w-20" />
              ) : config?.email ? (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-600 border-red-600">
                  <XCircle className="w-3 h-3 mr-1" />
                  Not Configured
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Templates
            </CardTitle>
            <CardDescription>
              Customize messages for different notification triggers
            </CardDescription>
          </div>
          <Button onClick={openNewDialog} data-testid="button-add-template">
            <Plus className="w-4 h-4 mr-2" />
            Add Template
          </Button>
        </CardHeader>
        <CardContent>
          {templatesLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : templates && templates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => {
                  const ChannelIcon = channelIcons[template.channel] || Bell;
                  return (
                    <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {template.trigger}
                          {template.triggerValue && `: ${template.triggerValue}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ChannelIcon className="w-4 h-4" />
                          {template.channel}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={template.isActive === "true" ? "default" : "secondary"}>
                          {template.isActive === "true" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditDialog(template)}
                            data-testid={`button-edit-${template.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteTemplateMutation.mutate(template.id)}
                            data-testid={`button-delete-${template.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No templates created yet</p>
              <Button variant="outline" className="mt-4" onClick={openNewDialog}>
                Create Your First Template
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? "Edit Template" : "Create Template"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Customer Approval SMS"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Trigger</Label>
                <Select
                  value={formData.trigger}
                  onValueChange={(v) => setFormData({ ...formData, trigger: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status_change">Status Change</SelectItem>
                    <SelectItem value="milestone_complete">Milestone Complete</SelectItem>
                    <SelectItem value="commission_earned">Commission Earned</SelectItem>
                    <SelectItem value="registration">New Registration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Trigger Value (optional)</Label>
                <Input
                  value={formData.triggerValue}
                  onChange={(e) => setFormData({ ...formData, triggerValue: e.target.value })}
                  placeholder="e.g., approved"
                />
              </div>
            </div>
            <div>
              <Label>Channel</Label>
              <Select
                value={formData.channel}
                onValueChange={(v) => setFormData({ ...formData, channel: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.channel === "email" && (
              <div>
                <Label>Email Subject</Label>
                <Input
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Enter email subject"
                />
              </div>
            )}
            <div>
              <Label>Message Template</Label>
              <Textarea
                value={formData.template}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                placeholder="Use {{name}}, {{status}}, {{amount}} as placeholders"
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Available variables: {"{{name}}, {{phone}}, {{status}}, {{amount}}, {{date}}"}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createTemplateMutation.isPending || updateTemplateMutation.isPending}
            >
              {editingTemplate ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="testPhone">Phone Number (for SMS/WhatsApp)</Label>
              <Input
                id="testPhone"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+91 9876543210"
              />
            </div>
            <div>
              <Label htmlFor="testEmail">Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <Label htmlFor="testMessage">Message</Label>
              <Textarea
                id="testMessage"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                testNotificationMutation.mutate({
                  phone: testPhone || undefined,
                  email: testEmail || undefined,
                  message: testMessage,
                })
              }
              disabled={testNotificationMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBroadcastDialog} onOpenChange={setShowBroadcastDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5" />
              Broadcast to All Partners
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
              <Users className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Send a message to all approved partners (BDPs and DDPs) at once via WhatsApp and/or Email.
              </p>
            </div>
            
            <div>
              <Label>Partner Type</Label>
              <Select
                value={broadcastPartnerType}
                onValueChange={setBroadcastPartnerType}
              >
                <SelectTrigger data-testid="select-partner-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Partners (BDPs + DDPs)</SelectItem>
                  <SelectItem value="bdp">BDPs Only</SelectItem>
                  <SelectItem value="ddp">DDPs Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="broadcastSubject">Subject / Title</Label>
              <Input
                id="broadcastSubject"
                value={broadcastSubject}
                onChange={(e) => setBroadcastSubject(e.target.value)}
                placeholder="e.g., Important Meeting Tomorrow"
                data-testid="input-broadcast-subject"
              />
            </div>
            
            <div>
              <Label htmlFor="broadcastMessage">Message</Label>
              <Textarea
                id="broadcastMessage"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Enter your message here. Use {{name}} to personalize with partner's name."
                rows={5}
                data-testid="input-broadcast-message"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use {"{{name}}"} to include the partner's name in the message.
              </p>
            </div>
            
            <div className="space-y-3">
              <Label>Send via</Label>
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sendWhatsApp"
                    checked={broadcastSendWhatsApp}
                    onCheckedChange={(checked) => setBroadcastSendWhatsApp(checked as boolean)}
                    data-testid="checkbox-whatsapp"
                  />
                  <Label htmlFor="sendWhatsApp" className="flex items-center gap-1 cursor-pointer font-normal">
                    <MessageSquare className="w-4 h-4 text-green-600" />
                    WhatsApp
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sendEmail"
                    checked={broadcastSendEmail}
                    onCheckedChange={(checked) => setBroadcastSendEmail(checked as boolean)}
                    data-testid="checkbox-email"
                  />
                  <Label htmlFor="sendEmail" className="flex items-center gap-1 cursor-pointer font-normal">
                    <Mail className="w-4 h-4 text-purple-600" />
                    Email
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBroadcastDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                broadcastMutation.mutate({
                  subject: broadcastSubject,
                  message: broadcastMessage,
                  sendWhatsApp: broadcastSendWhatsApp,
                  sendEmail: broadcastSendEmail,
                  partnerType: broadcastPartnerType,
                })
              }
              disabled={broadcastMutation.isPending || !broadcastMessage.trim() || (!broadcastSendWhatsApp && !broadcastSendEmail)}
              data-testid="button-send-broadcast"
            >
              {broadcastMutation.isPending ? (
                <>Sending...</>
              ) : (
                <>
                  <Megaphone className="w-4 h-4 mr-2" />
                  Send Broadcast
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
