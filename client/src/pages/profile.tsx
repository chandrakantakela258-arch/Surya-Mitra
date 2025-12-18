import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { User, Building2, Phone, Mail, MapPin, CreditCard, Landmark } from "lucide-react";
import type { BankAccount } from "@shared/schema";

const bankAccountSchema = z.object({
  accountHolderName: z.string().min(2, "Account holder name is required"),
  accountNumber: z.string().min(9, "Valid account number is required"),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
  bankName: z.string().min(2, "Bank name is required"),
});

type BankAccountFormData = z.infer<typeof bankAccountSchema>;

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: bankAccount, isLoading: isBankLoading } = useQuery<BankAccount>({
    queryKey: ["/api/bank-account"],
  });

  const form = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      accountHolderName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
    },
  });

  const saveBankMutation = useMutation({
    mutationFn: async (data: BankAccountFormData) => {
      return apiRequest("POST", "/api/bank-account", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-account"] });
      toast({ title: "Bank details saved successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save bank details",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BankAccountFormData) => {
    saveBankMutation.mutate(data);
  };

  if (!user) {
    return null;
  }

  const roleLabel = user.role === "bdp" ? "Business Development Partner" : "District Development Partner";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">View your account details and manage bank information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Personal Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {user.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <Badge variant="outline">{roleLabel}</Badge>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{user.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span>{user.district}, {user.state}</span>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{user.address}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Account Status:</span>
                <Badge variant={user.status === "approved" ? "default" : "secondary"}>
                  {user.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="w-5 h-5" />
              Bank Account Details
            </CardTitle>
            <CardDescription>
              Add your bank details to receive commission payouts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isBankLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : bankAccount ? (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Saved Bank Account</span>
                  </div>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Holder:</span>
                      <span className="font-medium">{bankAccount.accountHolderName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Account Number:</span>
                      <span className="font-medium">
                        ****{bankAccount.accountNumber.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IFSC Code:</span>
                      <span className="font-medium">{bankAccount.ifscCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bank Name:</span>
                      <span className="font-medium">{bankAccount.bankName}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  To update your bank details, please contact support.
                </p>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="accountHolderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Holder Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="As per bank records" 
                            {...field} 
                            data-testid="input-account-holder"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter account number" 
                            {...field} 
                            data-testid="input-account-number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ifscCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IFSC Code</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. SBIN0001234" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            data-testid="input-ifsc"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g. State Bank of India" 
                            {...field} 
                            data-testid="input-bank-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={saveBankMutation.isPending}
                    data-testid="button-save-bank"
                  >
                    {saveBankMutation.isPending ? "Saving..." : "Save Bank Details"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
