import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  FileText, 
  IndianRupee, 
  TrendingUp, 
  TrendingDown,
  Calculator,
  Loader2,
  Search,
  Eye,
  Edit,
  Zap,
  Building,
  Truck,
  CreditCard,
  Users
} from "lucide-react";
import type { SiteExpense, Customer } from "@shared/schema";

export default function AdminSiteExpenses() {
  const { toast } = useToast();
  const [selectedExpense, setSelectedExpense] = useState<SiteExpense | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});

  const { data: expenses = [], isLoading: expensesLoading } = useQuery<SiteExpense[]>({
    queryKey: ["/api/admin/site-expenses"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/admin/customers"],
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SiteExpense> }) => {
      return await apiRequest("PATCH", `/api/admin/site-expenses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/site-expenses"] });
      toast({ title: "Site expense updated successfully" });
      setIsEditOpen(false);
      setSelectedExpense(null);
    },
    onError: () => {
      toast({ title: "Failed to update site expense", variant: "destructive" });
    },
  });

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const getCustomerDetails = (customerId: string) => {
    return customers.find((c) => c.id === customerId);
  };

  const formatCurrency = (value: string | null | undefined) => {
    const num = Number(value || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleEdit = (expense: SiteExpense) => {
    setSelectedExpense(expense);
    setFormData({
      customerPaymentReceived: expense.customerPaymentReceived || "0",
      solarPanelsCost: expense.solarPanelsCost || "0",
      inverterCost: expense.inverterCost || "0",
      electricalCost: expense.electricalCost || "0",
      civilWorkCost: expense.civilWorkCost || "0",
      electricianCost: expense.electricianCost || "0",
      meterCost: expense.meterCost || "0",
      meterInstallationCost: expense.meterInstallationCost || "0",
      logisticCost: expense.logisticCost || "0",
      bankLoanApprovalCost: expense.bankLoanApprovalCost || "0",
      discomApprovalCost: expense.discomApprovalCost || "0",
      bdpCommission: expense.bdpCommission || "0",
      ddpCommission: expense.ddpCommission || "0",
      referralPayment: expense.referralPayment || "0",
      incentivePayment: expense.incentivePayment || "0",
      miscellaneousExpense: expense.miscellaneousExpense || "0",
      miscellaneousNotes: expense.miscellaneousNotes || "",
      notes: expense.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleSave = () => {
    if (!selectedExpense) return;
    updateExpenseMutation.mutate({
      id: selectedExpense.id,
      data: formData,
    });
  };

  const calculateFormTotals = () => {
    const totalExpenses =
      Number(formData.solarPanelsCost || 0) +
      Number(formData.inverterCost || 0) +
      Number(formData.electricalCost || 0) +
      Number(formData.civilWorkCost || 0) +
      Number(formData.electricianCost || 0) +
      Number(formData.meterCost || 0) +
      Number(formData.meterInstallationCost || 0) +
      Number(formData.logisticCost || 0) +
      Number(formData.bankLoanApprovalCost || 0) +
      Number(formData.discomApprovalCost || 0) +
      Number(formData.bdpCommission || 0) +
      Number(formData.ddpCommission || 0) +
      Number(formData.referralPayment || 0) +
      Number(formData.incentivePayment || 0) +
      Number(formData.miscellaneousExpense || 0);

    const payment = Number(formData.customerPaymentReceived || 0);
    const profit = payment - totalExpenses;
    const profitMargin = payment > 0 ? (profit / payment) * 100 : 0;

    return { totalExpenses, profit, profitMargin };
  };

  const filteredExpenses = expenses.filter((expense) => {
    const customer = getCustomerDetails(expense.customerId);
    const searchLower = searchQuery.toLowerCase();
    return (
      expense.siteId.toLowerCase().includes(searchLower) ||
      customer?.name?.toLowerCase().includes(searchLower) ||
      customer?.phone?.includes(searchQuery)
    );
  });

  // Summary stats
  const totalRevenue = expenses.reduce((sum, e) => sum + Number(e.customerPaymentReceived || 0), 0);
  const totalExpensesSum = expenses.reduce((sum, e) => sum + Number(e.totalExpenses || 0), 0);
  const totalProfit = expenses.reduce((sum, e) => sum + Number(e.profit || 0), 0);
  const avgProfitMargin = expenses.length > 0 
    ? expenses.reduce((sum, e) => sum + Number(e.profitMargin || 0), 0) / expenses.length 
    : 0;

  if (expensesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Site Installation Expenses</h1>
          <p className="text-muted-foreground">Track costs and profit for each installation</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-revenue">{formatCurrency(String(totalRevenue))}</div>
            <p className="text-xs text-muted-foreground">{expenses.length} sites</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-expenses">{formatCurrency(String(totalExpensesSum))}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
            {totalProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`} data-testid="text-total-profit">
              {formatCurrency(String(totalProfit))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Profit Margin</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${avgProfitMargin >= 0 ? "text-green-600" : "text-red-600"}`} data-testid="text-avg-margin">
              {avgProfitMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 max-w-md">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by Site ID, customer name, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          data-testid="input-search"
        />
      </div>

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Payment Received</TableHead>
                <TableHead>Total Expenses</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Margin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No site expenses found
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => {
                  const customer = getCustomerDetails(expense.customerId);
                  const profit = Number(expense.profit || 0);
                  const margin = Number(expense.profitMargin || 0);
                  
                  return (
                    <TableRow key={expense.id} data-testid={`row-expense-${expense.id}`}>
                      <TableCell className="font-mono font-medium">{expense.siteId}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer?.name || "Unknown"}</div>
                          <div className="text-sm text-muted-foreground">{customer?.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(expense.customerPaymentReceived)}</TableCell>
                      <TableCell>{formatCurrency(expense.totalExpenses)}</TableCell>
                      <TableCell className={profit >= 0 ? "text-green-600" : "text-red-600"}>
                        {formatCurrency(String(profit))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={margin >= 15 ? "default" : margin >= 0 ? "secondary" : "destructive"}>
                          {margin.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={expense.status === "completed" ? "default" : "secondary"}>
                          {expense.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(expense)}
                          data-testid={`button-edit-${expense.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Edit Site Expense - {selectedExpense?.siteId}
            </DialogTitle>
          </DialogHeader>

          {selectedExpense && (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Customer Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>{" "}
                      <span className="font-medium">{getCustomerName(selectedExpense.customerId)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Site ID:</span>{" "}
                      <span className="font-mono font-medium">{selectedExpense.siteId}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Payment */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Customer Payment Received
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Rs.</span>
                    <Input
                      type="number"
                      value={formData.customerPaymentReceived}
                      onChange={(e) => setFormData({ ...formData, customerPaymentReceived: e.target.value })}
                      className="max-w-xs"
                      data-testid="input-customer-payment"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Installation Costs */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Installation Costs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Solar Panels Cost</Label>
                      <Input
                        type="number"
                        value={formData.solarPanelsCost}
                        onChange={(e) => setFormData({ ...formData, solarPanelsCost: e.target.value })}
                        data-testid="input-solar-panels-cost"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Inverter Cost</Label>
                      <Input
                        type="number"
                        value={formData.inverterCost}
                        onChange={(e) => setFormData({ ...formData, inverterCost: e.target.value })}
                        data-testid="input-inverter-cost"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Electrical Cost</Label>
                      <Input
                        type="number"
                        value={formData.electricalCost}
                        onChange={(e) => setFormData({ ...formData, electricalCost: e.target.value })}
                        data-testid="input-electrical-cost"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Civil Work Execution Cost</Label>
                      <Input
                        type="number"
                        value={formData.civilWorkCost}
                        onChange={(e) => setFormData({ ...formData, civilWorkCost: e.target.value })}
                        data-testid="input-civil-work-cost"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Electrician Cost</Label>
                      <Input
                        type="number"
                        value={formData.electricianCost}
                        onChange={(e) => setFormData({ ...formData, electricianCost: e.target.value })}
                        data-testid="input-electrician-cost"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Meter Cost</Label>
                      <Input
                        type="number"
                        value={formData.meterCost}
                        onChange={(e) => setFormData({ ...formData, meterCost: e.target.value })}
                        data-testid="input-meter-cost"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Meter Installation Cost</Label>
                      <Input
                        type="number"
                        value={formData.meterInstallationCost}
                        onChange={(e) => setFormData({ ...formData, meterInstallationCost: e.target.value })}
                        data-testid="input-meter-installation-cost"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Other Costs */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Other Costs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Logistic Cost</Label>
                      <Input
                        type="number"
                        value={formData.logisticCost}
                        onChange={(e) => setFormData({ ...formData, logisticCost: e.target.value })}
                        data-testid="input-logistic-cost"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Loan Approval Cost</Label>
                      <Input
                        type="number"
                        value={formData.bankLoanApprovalCost}
                        onChange={(e) => setFormData({ ...formData, bankLoanApprovalCost: e.target.value })}
                        data-testid="input-bank-loan-cost"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>DISCOM Approval Cost</Label>
                      <Input
                        type="number"
                        value={formData.discomApprovalCost}
                        onChange={(e) => setFormData({ ...formData, discomApprovalCost: e.target.value })}
                        data-testid="input-discom-cost"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Miscellaneous Expense</Label>
                      <Input
                        type="number"
                        value={formData.miscellaneousExpense}
                        onChange={(e) => setFormData({ ...formData, miscellaneousExpense: e.target.value })}
                        data-testid="input-misc-expense"
                      />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Label>Miscellaneous Notes</Label>
                    <Textarea
                      value={formData.miscellaneousNotes}
                      onChange={(e) => setFormData({ ...formData, miscellaneousNotes: e.target.value })}
                      placeholder="Details about miscellaneous expenses..."
                      data-testid="input-misc-notes"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Commission Payments */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Commission Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>BDP Commission</Label>
                      <Input
                        type="number"
                        value={formData.bdpCommission}
                        onChange={(e) => setFormData({ ...formData, bdpCommission: e.target.value })}
                        data-testid="input-bdp-commission"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>DDP Commission</Label>
                      <Input
                        type="number"
                        value={formData.ddpCommission}
                        onChange={(e) => setFormData({ ...formData, ddpCommission: e.target.value })}
                        data-testid="input-ddp-commission"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Referral Payment</Label>
                      <Input
                        type="number"
                        value={formData.referralPayment}
                        onChange={(e) => setFormData({ ...formData, referralPayment: e.target.value })}
                        data-testid="input-referral-payment"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Incentive Payment</Label>
                      <Input
                        type="number"
                        value={formData.incentivePayment}
                        onChange={(e) => setFormData({ ...formData, incentivePayment: e.target.value })}
                        data-testid="input-incentive-payment"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Additional Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Any additional notes about this installation..."
                    data-testid="input-notes"
                  />
                </CardContent>
              </Card>

              {/* Calculated Summary */}
              <Card className="bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Calculated Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const { totalExpenses, profit, profitMargin } = calculateFormTotals();
                    return (
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-sm text-muted-foreground">Total Expenses</div>
                          <div className="text-xl font-bold">{formatCurrency(String(totalExpenses))}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Profit</div>
                          <div className={`text-xl font-bold ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatCurrency(String(profit))}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Profit Margin</div>
                          <div className={`text-xl font-bold ${profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {profitMargin.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)} data-testid="button-cancel">
                  Cancel
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={updateExpenseMutation.isPending}
                  data-testid="button-save"
                >
                  {updateExpenseMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
