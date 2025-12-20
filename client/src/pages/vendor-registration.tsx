import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sun, Wrench, MapPin, Building2, Phone, Mail, Users, FileText, CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { vendorServices, vendorStates } from "@shared/schema";
import { Link } from "wouter";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Enter valid phone number").max(10, "Enter valid 10-digit phone number"),
  email: z.string().email("Enter valid email").optional().or(z.literal("")),
  companyName: z.string().optional(),
  state: z.string().min(1, "Select a state"),
  district: z.string().min(2, "Enter district name"),
  address: z.string().min(10, "Enter complete address"),
  pincode: z.string().length(6, "Enter valid 6-digit pincode"),
  services: z.array(z.string()).min(1, "Select at least one service"),
  experience: z.string().optional(),
  teamSize: z.number().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

const districtsByState: Record<string, string[]> = {
  "Bihar": ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Purnia", "Darbhanga", "Munger", "Begusarai", "Samastipur", "Vaishali", "Saran", "Nalanda", "Aurangabad", "Rohtas", "Katihar"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar", "Giridih", "Dumka", "Ramgarh", "Chatra", "Gumla", "Pakur", "Godda", "Koderma", "Lohardaga"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Meerut", "Ghaziabad", "Noida", "Gorakhpur", "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Jhansi", "Mathura"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Baripada", "Bhadrak", "Jharsuguda", "Jeypore", "Angul", "Dhenkanal", "Kendrapara", "Koraput"],
};

export default function VendorRegistration() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [selectedState, setSelectedState] = useState<string>("");
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      companyName: "",
      state: "",
      district: "",
      address: "",
      pincode: "",
      services: [],
      experience: "",
      teamSize: undefined,
      gstNumber: "",
      panNumber: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/public/vendors/register", data);
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Registration Successful",
        description: "We will review your application and contact you soon.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    registerMutation.mutate(data);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Registration Submitted!</h1>
            <p className="text-muted-foreground mb-8">
              Thank you for registering as a site installation vendor. Our team will review your application and contact you within 2-3 business days.
            </p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sun className="w-8 h-8 text-orange-500" />
              <h1 className="text-2xl font-bold">Divyanshi Solar</h1>
            </div>
            <h2 className="text-xl font-semibold mb-2">Site Installation Vendor Registration</h2>
            <p className="text-muted-foreground">
              Join our network of trusted installation vendors for PM Surya Ghar Yojana
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {vendorStates.map((state) => (
                <span key={state.value} className="px-3 py-1 text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
                  {state.label}
                </span>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                Vendor Details
              </CardTitle>
              <CardDescription>
                Fill in your details to register as a solar installation vendor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} data-testid="input-vendor-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <span className="inline-flex items-center px-3 text-sm border border-r-0 rounded-l-md bg-muted text-muted-foreground">
                                +91
                              </span>
                              <Input 
                                placeholder="9876543210" 
                                className="rounded-l-none" 
                                {...field} 
                                data-testid="input-vendor-phone"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@example.com" {...field} data-testid="input-vendor-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company/Firm Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Your company name (if any)" {...field} data-testid="input-vendor-company" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State *</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedState(value);
                                form.setValue("district", "");
                              }} 
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-vendor-state">
                                  <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {vendorStates.map((state) => (
                                  <SelectItem key={state.value} value={state.value}>
                                    {state.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="district"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>District *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={!selectedState}>
                              <FormControl>
                                <SelectTrigger data-testid="select-vendor-district">
                                  <SelectValue placeholder={selectedState ? "Select district" : "Select state first"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {selectedState && districtsByState[selectedState]?.map((district) => (
                                  <SelectItem key={district} value={district}>
                                    {district}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Full Address *</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter your complete address" 
                                {...field} 
                                data-testid="input-vendor-address"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="pincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pincode *</FormLabel>
                            <FormControl>
                              <Input placeholder="123456" maxLength={6} {...field} data-testid="input-vendor-pincode" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Services & Experience
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="services"
                      render={() => (
                        <FormItem>
                          <FormLabel>Services Offered *</FormLabel>
                          <FormDescription>Select all services you can provide</FormDescription>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                            {vendorServices.map((service) => (
                              <FormField
                                key={service.value}
                                control={form.control}
                                name="services"
                                render={({ field }) => (
                                  <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(service.value)}
                                        onCheckedChange={(checked) => {
                                          const newValue = checked
                                            ? [...(field.value || []), service.value]
                                            : field.value?.filter((v) => v !== service.value) || [];
                                          field.onChange(newValue);
                                        }}
                                        data-testid={`checkbox-service-${service.value}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {service.label}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <FormField
                        control={form.control}
                        name="experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Years of Experience</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-vendor-experience">
                                  <SelectValue placeholder="Select experience" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="0-1">Less than 1 year</SelectItem>
                                <SelectItem value="1-3">1-3 years</SelectItem>
                                <SelectItem value="3-5">3-5 years</SelectItem>
                                <SelectItem value="5-10">5-10 years</SelectItem>
                                <SelectItem value="10+">10+ years</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="teamSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team Size (Technicians)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="Number of technicians"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                value={field.value || ""}
                                data-testid="input-vendor-team-size"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Business Documents (Optional)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="gstNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>GST Number</FormLabel>
                            <FormControl>
                              <Input placeholder="22AAAAA0000A1Z5" {...field} data-testid="input-vendor-gst" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="panNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PAN Number</FormLabel>
                            <FormControl>
                              <Input placeholder="AAAAA1234A" {...field} data-testid="input-vendor-pan" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button type="submit" className="flex-1" disabled={registerMutation.isPending} data-testid="button-submit-vendor">
                      {registerMutation.isPending ? "Submitting..." : "Submit Registration"}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <Link href="/">Cancel</Link>
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              By registering, you agree to work with Divyanshi Solar for solar panel installations under PM Surya Ghar Yojana.
            </p>
            <p className="mt-2">
              For queries, contact us at{" "}
              <a href="tel:+919876543210" className="text-orange-600 hover:underline">
                +91 98765 43210
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
