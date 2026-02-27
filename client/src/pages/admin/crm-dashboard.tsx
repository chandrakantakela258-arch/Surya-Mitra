import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Users, RefreshCw, MessageSquare, Sun, FileText, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function CrmDashboard() {
  const { data: leads = [], isLoading, refetch, isFetching } = useQuery<any[]>({
    queryKey: ['/api/leads'],
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
    a.setAttribute('download', `Divyanshi_Solar_Bot_Leads_${new Date().toISOString().slice(0,10)}.csv`);
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
