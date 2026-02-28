import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Download, Users, RefreshCw, MessageSquare, Sun, FileText, CheckCircle, Clock, Settings, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function CrmDashboard() {
  const { toast } = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    VERIFY_TOKEN: '',
    META_ACCESS_TOKEN: '',
    PHONE_NUMBER_ID: '',
    WHATSAPP_BOT_NUMBER: ''
  });

  const { data: leads = [], isLoading, refetch, isFetching } = useQuery<any[]>({
    queryKey: ['/api/leads'],
  });

  const { data: settingsData } = useQuery({
    queryKey: ['/api/admin/whatsapp-settings'],
  });

  useEffect(() => {
    if (settingsData) {
      setSettingsForm({
        VERIFY_TOKEN: settingsData.VERIFY_TOKEN || '',
        META_ACCESS_TOKEN: settingsData.META_ACCESS_TOKEN || '',
        PHONE_NUMBER_ID: settingsData.PHONE_NUMBER_ID || '',
        WHATSAPP_BOT_NUMBER: settingsData.WHATSAPP_BOT_NUMBER || ''
      });
    }
  }, [settingsData]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data: typeof settingsForm) => {
      return await apiRequest('POST', '/api/admin/whatsapp-settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/whatsapp-settings'] });
      setIsSettingsOpen(false);
      toast({ title: 'Settings Saved', description: 'Meta API configuration updated successfully.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update settings.', variant: 'destructive' });
    }
  });

  const exportToCsv = () => {
    if (!leads || leads.length === 0) return;

    const headers = ["ID", "Phone", "Name", "Email", "Lang", "State", "District", "City", "Pincode", "Electricity Board", "Consumer No", "Meter Type", "Roof Space(sqft)", "Business Type", "Monthly Billing", "Plant Capacity", "Proposal Reply", "Final Status", "Captured Date"];

    const csvRows = [
      headers.join(','),
      ...leads.map((lead: any) => [
        lead.id,
        "'" + lead.phone,
        `"${lead.name || ''}"`,
        `"${lead.email || ''}"`,
        lead.language || '',
        `"${lead.state || ''}"`,
        `"${lead.district || ''}"`,
        `"${lead.city || ''}"`,
        lead.pincode || '',
        `"${lead.electricityBoard || ''}"`,
        `"${lead.consumerNumber || ''}"`,
        lead.meterType || '',
        lead.roofSpace || '',
        `"${lead.businessType || ''}"`,
        `"${lead.monthlyBilling || ''}"`,
        lead.plantCapacity || '',
        `"${lead.proposalStatus || ''}"`,
        lead.status || '',
        lead.createdAt ? new Date(lead.createdAt).toLocaleString() : ''
      ].join(','))
    ];

    const csvData = csvRows.join('\n');
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `Divyanshi_Solar_Bot_Leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const totalLeads = leads?.length || 0;
  const newLeads = leads?.filter((l: any) => l.status === 'New' || !l.status).length || 0;
  const interestedLeads = leads?.filter((l: any) =>
    l.proposalStatus === 'रुचि है' ||
    l.proposalStatus === 'Interested' ||
    l.proposalStatus?.toLowerCase().includes('interested')
  ).length || 0;
  const closedLeads = leads?.filter((l: any) => l.status === 'Closed').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Solar Bot Leads</h1>
            <p className="text-muted-foreground">Manage and export leads captured from your WhatsApp Chatbot</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px]">
              <DialogHeader>
                <DialogTitle>WhatsApp API Configuration</DialogTitle>
                <DialogDescription>Setup your server connection to Meta's WhatsApp Cloud API.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Webhook Verify Token</Label>
                  <Input
                    type="password"
                    placeholder="Enter a custom secure token"
                    value={settingsForm.VERIFY_TOKEN}
                    onChange={e => setSettingsForm(prev => ({ ...prev, VERIFY_TOKEN: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>System User Access Token</Label>
                  <Input
                    type="password"
                    placeholder="EAAG... temporary or permanent token"
                    value={settingsForm.META_ACCESS_TOKEN}
                    onChange={e => setSettingsForm(prev => ({ ...prev, META_ACCESS_TOKEN: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number ID</Label>
                  <Input
                    placeholder="e.g. 5245812932..."
                    value={settingsForm.PHONE_NUMBER_ID}
                    onChange={e => setSettingsForm(prev => ({ ...prev, PHONE_NUMBER_ID: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Live Bot Phone Number (For Links)</Label>
                  <Input
                    placeholder="e.g. 919801005212"
                    value={settingsForm.WHATSAPP_BOT_NUMBER}
                    onChange={e => setSettingsForm(prev => ({ ...prev, WHATSAPP_BOT_NUMBER: e.target.value }))}
                  />
                </div>
                <Button
                  className="w-full mt-2"
                  onClick={() => saveSettingsMutation.mutate(settingsForm)}
                  disabled={saveSettingsMutation.isPending}
                >
                  {saveSettingsMutation.isPending ? "Saving..." : "Save Configuration"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportToCsv} className="bg-green-600 hover:bg-green-700">
            <Download className="mr-2 h-4 w-4" />
            Export to Excel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalLeads}</p>
            <p className="text-xs text-muted-foreground mt-1">Chatbot Conversations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Leads</CardTitle>
            <Sun className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{newLeads}</p>
            <p className="text-xs text-muted-foreground mt-1">Fresh queries</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">High Intent</CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{interestedLeads}</p>
            <p className="text-xs text-muted-foreground mt-1">Positive replies to Proposal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Closed</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{closedLeads}</p>
            <p className="text-xs text-muted-foreground mt-1">Processed action items</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Detailed Lead Log
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location Details</TableHead>
                  <TableHead>Capacity & Roof</TableHead>
                  <TableHead>Business & Meter</TableHead>
                  <TableHead>Billing Profile</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Captured On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Loading leads...</TableCell>
                  </TableRow>
                ) : !leads || leads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No leads captured yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  leads.map((lead: any) => (
                    <TableRow key={lead.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium whitespace-nowrap">
                        {lead.name || 'Unknown'}
                        {lead.email && <div className="text-xs text-muted-foreground font-normal">{lead.email}</div>}
                      </TableCell>
                      <TableCell>
                        <a href={`https://wa.me/${lead.phone.replace(/\\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-primary flex items-center whitespace-nowrap">
                          {lead.phone}
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{lead.city ? `${lead.city}, ` : ''}{lead.district || ''}</div>
                          <div className="text-xs text-muted-foreground">
                            {lead.state} {lead.pincode}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-semibold text-primary">{lead.plantCapacity || '- kW'}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Roof Space: {lead.roofSpace || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{lead.businessType || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">
                            Meter: {lead.meterType || 'N/A'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{lead.monthlyBilling || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">
                            {lead.electricityBoard || 'N/A'} {lead.consumerNumber ? `(${lead.consumerNumber})` : ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 items-start">
                          <Badge
                            variant={
                              lead.status === 'Closed' ? 'destructive' :
                                lead.status === 'New' ? 'outline' : 'default'
                            }
                            className={lead.status !== 'Closed' && lead.status !== 'New' ? 'bg-green-100 text-green-800 hover:bg-green-100 shadow-none' : 'shadow-none'}
                          >
                            {lead.status || 'Active'}
                          </Badge>
                          {lead.proposalStatus && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded uppercase tracking-wider font-medium">
                              {lead.proposalStatus}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                        {lead.createdAt ? format(new Date(lead.createdAt), 'MMM d, yyyy') : '-'}
                        <div className="text-xs opacity-75">
                          {lead.createdAt ? format(new Date(lead.createdAt), 'h:mm a') : ''}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
