import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  IndianRupee, 
  Calculator,
  Loader2,
  Search,
  Edit,
  Trash2,
  Plus,
  Mountain,
  Truck,
  Factory,
  Package,
  CreditCard,
  Building,
  Users,
  Briefcase,
  Home,
  FileText,
  Receipt
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminExpense } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const months = [
  "January 2025", "February 2025", "March 2025", "April 2025", "May 2025", "June 2025",
  "July 2025", "August 2025", "September 2025", "October 2025", "November 2025", "December 2025",
  "January 2026", "February 2026", "March 2026", "April 2026", "May 2026", "June 2026",
  "July 2026", "August 2026", "September 2026", "October 2026", "November 2026", "December 2026",
];

export default function AdminExpenses() {
  const { toast } = useToast();
  const [selectedExpense, setSelectedExpense] = useState<AdminExpense | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({
    month: "",
    quantityInTons: "",
    transportDistanceKm: "",
    blastingRatePerTon: "",
    quarryOwnerRatePerTon: "",
    transportationRatePerTonPerKm: "",
    crushingCostPerTon: "",
    materialShiftingCostPerTon: "",
    loadingCostPerTon: "",
    miningChallanCostPerTon: "",
    travellingCost: "",
    staffSalary: "",
    roomRent: "",
    departmentCost: "",
    miscellaneousCost: "",
    miscellaneousDescription: "",
    notes: "",
  });

  const { data: expenses = [], isLoading } = useQuery<AdminExpense[]>({
    queryKey: ["/api/admin/expenses"],
  });

  const { data: summary } = useQuery<{ totalExpenses: number; monthlyBreakdown: { month: string; total: number }[] }>({
    queryKey: ["/api/admin/expenses/summary"],
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      return await apiRequest("POST", "/api/admin/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/expenses/summary"] });
      toast({ title: "Expense added successfully" });
      setIsAddOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: "Failed to add expense", variant: "destructive" });
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, string> }) => {
      return await apiRequest("PATCH", `/api/admin/expenses/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/expenses/summary"] });
      toast({ title: "Expense updated successfully" });
      setIsEditOpen(false);
      setSelectedExpense(null);
    },
    onError: () => {
      toast({ title: "Failed to update expense", variant: "destructive" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/admin/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/expenses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/expenses/summary"] });
      toast({ title: "Expense deleted successfully" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Failed to delete expense", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      month: "",
      quantityInTons: "",
      transportDistanceKm: "",
      blastingRatePerTon: "",
      quarryOwnerRatePerTon: "",
      transportationRatePerTonPerKm: "",
      crushingCostPerTon: "",
      materialShiftingCostPerTon: "",
      loadingCostPerTon: "",
      miningChallanCostPerTon: "",
      travellingCost: "",
      staffSalary: "",
      roomRent: "",
      departmentCost: "",
      miscellaneousCost: "",
      miscellaneousDescription: "",
      notes: "",
    });
  };

  const formatCurrency = (value: string | null | undefined) => {
    const num = Number(value || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleEdit = (expense: AdminExpense) => {
    setSelectedExpense(expense);
    setFormData({
      month: expense.month || "",
      quantityInTons: expense.quantityInTons || "",
      transportDistanceKm: expense.transportDistanceKm || "",
      blastingRatePerTon: expense.blastingRatePerTon || "",
      quarryOwnerRatePerTon: expense.quarryOwnerRatePerTon || "",
      transportationRatePerTonPerKm: expense.transportationRatePerTonPerKm || "",
      crushingCostPerTon: expense.crushingCostPerTon || "",
      materialShiftingCostPerTon: expense.materialShiftingCostPerTon || "",
      loadingCostPerTon: expense.loadingCostPerTon || "",
      miningChallanCostPerTon: expense.miningChallanCostPerTon || "",
      travellingCost: expense.travellingCost || "",
      staffSalary: expense.staffSalary || "",
      roomRent: expense.roomRent || "",
      departmentCost: expense.departmentCost || "",
      miscellaneousCost: expense.miscellaneousCost || "",
      miscellaneousDescription: expense.miscellaneousDescription || "",
      notes: expense.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleSave = () => {
    if (selectedExpense) {
      updateExpenseMutation.mutate({ id: selectedExpense.id, data: formData });
    }
  };

  const handleAdd = () => {
    if (!formData.month) {
      toast({ title: "Please select a month", variant: "destructive" });
      return;
    }
    createExpenseMutation.mutate(formData);
  };

  const calculateFormTotals = () => {
    const quantity = Number(formData.quantityInTons || 0);
    const distance = Number(formData.transportDistanceKm || 0);
    
    // Per-ton costs (multiplied by quantity)
    const perTonRates = [
      Number(formData.blastingRatePerTon || 0),
      Number(formData.quarryOwnerRatePerTon || 0),
      Number(formData.crushingCostPerTon || 0),
      Number(formData.materialShiftingCostPerTon || 0),
      Number(formData.loadingCostPerTon || 0),
      Number(formData.miningChallanCostPerTon || 0),
    ];
    const totalPerTonCost = perTonRates.reduce((a, b) => a + b, 0) * quantity;
    
    // Transportation cost (rate * quantity * distance)
    const transportCost = Number(formData.transportationRatePerTonPerKm || 0) * quantity * distance;
    
    const fixedCosts = [
      Number(formData.travellingCost || 0),
      Number(formData.staffSalary || 0),
      Number(formData.roomRent || 0),
      Number(formData.departmentCost || 0),
      Number(formData.miscellaneousCost || 0),
    ];
    const totalFixedCost = fixedCosts.reduce((a, b) => a + b, 0);
    
    return { totalPerTonCost: totalPerTonCost + transportCost, totalFixedCost, grandTotal: totalPerTonCost + transportCost + totalFixedCost };
  };

  const filteredExpenses = expenses.filter((expense) =>
    expense.month.toLowerCase().includes(searchQuery.toLowerCase()) ||
    expense.notes?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { totalPerTonCost, totalFixedCost, grandTotal } = calculateFormTotals();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-page-title">Expense Tracking</h1>
          <p className="text-muted-foreground">Track mining, quarry, and operational expenses</p>
        </div>
        <Button onClick={() => { resetForm(); setIsAddOpen(true); }} data-testid="button-add-expense">
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-expenses">
              {formatCurrency(String(summary?.totalExpenses || 0))}
            </div>
            <p className="text-xs text-muted-foreground">All time expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-entries">{expenses.length}</div>
            <p className="text-xs text-muted-foreground">Expense records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-this-month">
              {formatCurrency(String(
                summary?.monthlyBreakdown?.find(m => {
                  const now = new Date();
                  const monthName = now.toLocaleString('default', { month: 'long' });
                  const year = now.getFullYear();
                  return m.month === `${monthName} ${year}`;
                })?.total || 0
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Current month expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-2">
            <CardTitle className="text-sm font-medium">Avg Per Entry</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-expense">
              {formatCurrency(String(expenses.length > 0 ? (summary?.totalExpenses || 0) / expenses.length : 0))}
            </div>
            <p className="text-xs text-muted-foreground">Average expense per entry</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Expense Records</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by month..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Qty (Tons)</TableHead>
                  <TableHead className="text-right">Per-Ton Total</TableHead>
                  <TableHead className="text-right">Fixed Costs</TableHead>
                  <TableHead className="text-right">Grand Total</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No expense records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => {
                    const qty = Number(expense.quantityInTons || 0);
                    const perTonTotal = (
                      Number(expense.blastingRatePerTon || 0) +
                      Number(expense.quarryOwnerRatePerTon || 0) +
                      Number(expense.transportationRatePerTonPerKm || 0) +
                      Number(expense.crushingCostPerTon || 0) +
                      Number(expense.materialShiftingCostPerTon || 0) +
                      Number(expense.loadingCostPerTon || 0) +
                      Number(expense.miningChallanCostPerTon || 0)
                    ) * qty;
                    const fixedTotal = 
                      Number(expense.travellingCost || 0) +
                      Number(expense.staffSalary || 0) +
                      Number(expense.roomRent || 0) +
                      Number(expense.departmentCost || 0) +
                      Number(expense.miscellaneousCost || 0);
                    return (
                      <TableRow key={expense.id} data-testid={`row-expense-${expense.id}`}>
                        <TableCell className="font-medium">{expense.month}</TableCell>
                        <TableCell className="text-right">{qty.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(String(perTonTotal))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(String(fixedTotal))}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(expense.totalExpense)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(expense)}
                              data-testid={`button-edit-${expense.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteId(expense.id)}
                              data-testid={`button-delete-${expense.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen || isEditOpen} onOpenChange={() => { setIsAddOpen(false); setIsEditOpen(false); setSelectedExpense(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditOpen ? "Edit Expense" : "Add New Expense"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Month</Label>
                <Select value={formData.month} onValueChange={(v) => setFormData({ ...formData, month: v })}>
                  <SelectTrigger data-testid="select-month">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quantity (Tons)</Label>
                <Input
                  type="number"
                  value={formData.quantityInTons}
                  onChange={(e) => setFormData({ ...formData, quantityInTons: e.target.value })}
                  placeholder="Enter quantity in tons"
                  data-testid="input-quantity"
                />
              </div>
              <div className="space-y-2">
                <Label>Transport Distance (KM)</Label>
                <Input
                  type="number"
                  value={formData.transportDistanceKm}
                  onChange={(e) => setFormData({ ...formData, transportDistanceKm: e.target.value })}
                  placeholder="Enter distance in km"
                  data-testid="input-transport-distance"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Mountain className="h-5 w-5" />
                Per-Ton Rates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Factory className="h-4 w-4" />
                    Blasting Rate (per ton)
                  </Label>
                  <Input
                    type="number"
                    value={formData.blastingRatePerTon}
                    onChange={(e) => setFormData({ ...formData, blastingRatePerTon: e.target.value })}
                    placeholder="0"
                    data-testid="input-blasting"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Mountain className="h-4 w-4" />
                    Quarry Owner Rate (per ton)
                  </Label>
                  <Input
                    type="number"
                    value={formData.quarryOwnerRatePerTon}
                    onChange={(e) => setFormData({ ...formData, quarryOwnerRatePerTon: e.target.value })}
                    placeholder="0"
                    data-testid="input-quarry"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    Transportation (per ton/km)
                  </Label>
                  <Input
                    type="number"
                    value={formData.transportationRatePerTonPerKm}
                    onChange={(e) => setFormData({ ...formData, transportationRatePerTonPerKm: e.target.value })}
                    placeholder="0"
                    data-testid="input-transportation"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Factory className="h-4 w-4" />
                    Crushing Cost (per ton)
                  </Label>
                  <Input
                    type="number"
                    value={formData.crushingCostPerTon}
                    onChange={(e) => setFormData({ ...formData, crushingCostPerTon: e.target.value })}
                    placeholder="0"
                    data-testid="input-crushing"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    Material Shifting (per ton)
                  </Label>
                  <Input
                    type="number"
                    value={formData.materialShiftingCostPerTon}
                    onChange={(e) => setFormData({ ...formData, materialShiftingCostPerTon: e.target.value })}
                    placeholder="0"
                    data-testid="input-material-shifting"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    Loading Cost (per ton)
                  </Label>
                  <Input
                    type="number"
                    value={formData.loadingCostPerTon}
                    onChange={(e) => setFormData({ ...formData, loadingCostPerTon: e.target.value })}
                    placeholder="0"
                    data-testid="input-loading"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <CreditCard className="h-4 w-4" />
                    Mining Challan (per ton)
                  </Label>
                  <Input
                    type="number"
                    value={formData.miningChallanCostPerTon}
                    onChange={(e) => setFormData({ ...formData, miningChallanCostPerTon: e.target.value })}
                    placeholder="0"
                    data-testid="input-mining-challan"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Fixed/Recurring Costs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Truck className="h-4 w-4" />
                    Travelling Cost
                  </Label>
                  <Input
                    type="number"
                    value={formData.travellingCost}
                    onChange={(e) => setFormData({ ...formData, travellingCost: e.target.value })}
                    placeholder="0"
                    data-testid="input-travelling"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Staff Salary
                  </Label>
                  <Input
                    type="number"
                    value={formData.staffSalary}
                    onChange={(e) => setFormData({ ...formData, staffSalary: e.target.value })}
                    placeholder="0"
                    data-testid="input-staff-salary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Home className="h-4 w-4" />
                    Room Rent
                  </Label>
                  <Input
                    type="number"
                    value={formData.roomRent}
                    onChange={(e) => setFormData({ ...formData, roomRent: e.target.value })}
                    placeholder="0"
                    data-testid="input-room-rent"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    Department Cost
                  </Label>
                  <Input
                    type="number"
                    value={formData.departmentCost}
                    onChange={(e) => setFormData({ ...formData, departmentCost: e.target.value })}
                    placeholder="0"
                    data-testid="input-department"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Receipt className="h-4 w-4" />
                    Miscellaneous Cost
                  </Label>
                  <Input
                    type="number"
                    value={formData.miscellaneousCost}
                    onChange={(e) => setFormData({ ...formData, miscellaneousCost: e.target.value })}
                    placeholder="0"
                    data-testid="input-miscellaneous"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Miscellaneous Description</Label>
                <Textarea
                  value={formData.miscellaneousDescription}
                  onChange={(e) => setFormData({ ...formData, miscellaneousDescription: e.target.value })}
                  placeholder="Describe miscellaneous expenses..."
                  data-testid="input-misc-description"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  data-testid="input-notes"
                />
              </div>
            </div>

            <Card className="bg-muted">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground">Per-Ton Costs</p>
                    <p className="text-lg font-semibold">{formatCurrency(String(totalPerTonCost))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Fixed Costs</p>
                    <p className="text-lg font-semibold">{formatCurrency(String(totalFixedCost))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Grand Total</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(String(grandTotal))}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => { setIsAddOpen(false); setIsEditOpen(false); setSelectedExpense(null); }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                onClick={isEditOpen ? handleSave : handleAdd}
                disabled={createExpenseMutation.isPending || updateExpenseMutation.isPending}
                data-testid="button-save"
              >
                {(createExpenseMutation.isPending || updateExpenseMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {isEditOpen ? "Save Changes" : "Add Expense"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the expense record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteExpenseMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
