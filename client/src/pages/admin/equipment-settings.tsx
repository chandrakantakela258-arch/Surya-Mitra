import { useState, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Settings, Zap, Sun, X, Building2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface EquipmentMake {
  make: string;
  models: string[];
}

interface EquipmentOptions {
  moduleMakes: EquipmentMake[];
  inverterMakes: EquipmentMake[];
}

interface Vendor {
  id: string;
  name: string;
  address: string;
}

export default function EquipmentSettings() {
  const { toast } = useToast();
  const [newModuleMake, setNewModuleMake] = useState("");
  const [newInverterMake, setNewInverterMake] = useState("");
  const [modelInputs, setModelInputs] = useState<Record<string, string>>({});
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorAddress, setNewVendorAddress] = useState("");

  const { data: options, isLoading } = useQuery<EquipmentOptions>({
    queryKey: ["/api/admin/equipment-options"],
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { type: string; make: string; models: string[] }) => {
      return apiRequest("POST", "/api/admin/equipment-options", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/equipment-options"] });
      toast({ title: "Saved", description: "Equipment option saved successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, make }: { type: string; make: string }) => {
      return apiRequest("DELETE", `/api/admin/equipment-options/${type}/${encodeURIComponent(make)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/equipment-options"] });
      toast({ title: "Deleted", description: "Equipment make removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/admin/vendors"],
  });

  const addVendorMutation = useMutation({
    mutationFn: async (data: { name: string; address: string }) => {
      return apiRequest("POST", "/api/admin/vendors", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
      toast({ title: "Saved", description: "Vendor added successfully." });
      setNewVendorName("");
      setNewVendorAddress("");
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteVendorMutation = useMutation({
    mutationFn: async (key: string) => {
      return apiRequest("DELETE", `/api/admin/vendors/${encodeURIComponent(key)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vendors"] });
      toast({ title: "Deleted", description: "Vendor removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleAddMake = (type: "module" | "inverter") => {
    const make = type === "module" ? newModuleMake.trim() : newInverterMake.trim();
    if (!make) return;

    const existing = type === "module" ? options?.moduleMakes : options?.inverterMakes;
    if (existing?.some(e => e.make.toLowerCase() === make.toLowerCase())) {
      toast({ title: "Already exists", description: `${make} already exists.`, variant: "destructive" });
      return;
    }

    saveMutation.mutate({ type, make, models: [] });
    if (type === "module") setNewModuleMake("");
    else setNewInverterMake("");
  };

  const getModelInputKey = (type: string, make: string) => `${type}_${make}`;

  const handleAddModel = (type: "module" | "inverter", make: string) => {
    const key = getModelInputKey(type, make);
    const model = (modelInputs[key] || "").trim();
    if (!model) return;

    const existing = type === "module" ? options?.moduleMakes : options?.inverterMakes;
    const entry = existing?.find(e => e.make === make);
    const currentModels = entry?.models || [];

    if (currentModels.includes(model)) {
      toast({ title: "Already exists", description: `${model} already exists.`, variant: "destructive" });
      return;
    }

    saveMutation.mutate({ type, make, models: [...currentModels, model] });
    setModelInputs(prev => ({ ...prev, [key]: "" }));
  };

  const handleRemoveModel = (type: "module" | "inverter", make: string, model: string) => {
    const existing = type === "module" ? options?.moduleMakes : options?.inverterMakes;
    const entry = existing?.find(e => e.make === make);
    const updatedModels = (entry?.models || []).filter(m => m !== model);
    saveMutation.mutate({ type, make, models: updatedModels });
  };

  const renderEquipmentSection = (
    type: "module" | "inverter",
    title: string,
    icon: ReactNode,
    makes: EquipmentMake[],
    newMake: string,
    setNewMake: (v: string) => void
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>
          Add makes first, then add models under each make. These will appear as dropdown options in the MOA agreement form.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-xs font-medium mb-1.5 block">Add New Make</Label>
          <div className="flex gap-2">
            <Input
              value={newMake}
              onChange={(e) => setNewMake(e.target.value)}
              placeholder={`e.g., ${type === "module" ? "IB Solar, Tata Power Solar" : "SunPunch, Growatt"}`}
              onKeyDown={(e) => e.key === "Enter" && handleAddMake(type)}
              data-testid={`input-new-${type}-make`}
            />
            <Button
              onClick={() => handleAddMake(type)}
              disabled={!newMake.trim() || saveMutation.isPending}
              data-testid={`button-add-${type}-make`}
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </div>

        {makes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No {type === "module" ? "solar module" : "inverter"} makes added yet. Add a make above to get started.
          </p>
        )}

        {makes.map((entry) => {
          const inputKey = getModelInputKey(type, entry.make);
          const modelInputValue = modelInputs[inputKey] || "";

          return (
            <div key={entry.make} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold" data-testid={`text-${type}-make-${entry.make}`}>{entry.make}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteMutation.mutate({ type, make: entry.make })}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  data-testid={`button-delete-${type}-make-${entry.make}`}
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Remove Make
                </Button>
              </div>

              <Separator />

              <div>
                <Label className="text-xs font-medium mb-1.5 block">Models ({entry.models.length} added)</Label>
                {entry.models.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {entry.models.map((model) => (
                      <Badge key={model} variant="secondary" className="gap-1 py-1.5 px-3 text-sm" data-testid={`badge-${type}-model-${model}`}>
                        {model}
                        <button
                          onClick={() => handleRemoveModel(type, entry.make, model)}
                          className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                          data-testid={`button-remove-${type}-model-${model}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={modelInputValue}
                    onChange={(e) => setModelInputs(prev => ({ ...prev, [inputKey]: e.target.value }))}
                    placeholder={`Enter ${type === "module" ? "module" : "inverter"} model name for ${entry.make}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddModel(type, entry.make);
                    }}
                    data-testid={`input-model-${type}-${entry.make}`}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleAddModel(type, entry.make)}
                    disabled={!modelInputValue.trim() || saveMutation.isPending}
                    data-testid={`button-add-model-${type}-${entry.make}`}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Model
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Settings className="w-6 h-6 text-orange-600" />
          Solar Equipment Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure solar module and inverter options. Add makes and models here - they will appear as dropdown selections in the MOA agreement form.
        </p>
      </div>

      <Separator />

      {renderEquipmentSection(
        "module",
        "Solar Module Makes & Models",
        <Sun className="w-5 h-5 text-yellow-500" />,
        options?.moduleMakes || [],
        newModuleMake,
        setNewModuleMake
      )}

      {renderEquipmentSection(
        "inverter",
        "Solar Inverter Makes & Models",
        <Zap className="w-5 h-5 text-blue-500" />,
        options?.inverterMakes || [],
        newInverterMake,
        setNewInverterMake
      )}

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="w-5 h-5 text-green-600" />
            Vendor Management
          </CardTitle>
          <CardDescription>
            Add vendor names and addresses here. They will appear as dropdown options in the MOA agreement form and auto-populate vendor details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Vendor Name</Label>
              <Input
                value={newVendorName}
                onChange={(e) => setNewVendorName(e.target.value)}
                placeholder="e.g., Hewtech System Pvt. Ltd."
                data-testid="input-new-vendor-name"
              />
            </div>
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Vendor Address</Label>
              <Textarea
                value={newVendorAddress}
                onChange={(e) => setNewVendorAddress(e.target.value)}
                placeholder="e.g., Golu Babu Market, Ashiyana Digha Road, Rajiv Nagar, Patna -25"
                rows={2}
                data-testid="input-new-vendor-address"
              />
            </div>
            <Button
              onClick={() => {
                if (!newVendorName.trim()) return;
                addVendorMutation.mutate({ name: newVendorName.trim(), address: newVendorAddress.trim() });
              }}
              disabled={!newVendorName.trim() || addVendorMutation.isPending}
              data-testid="button-add-vendor"
            >
              <Plus className="w-4 h-4 mr-1" /> Add Vendor
            </Button>
          </div>

          {vendors.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No vendors added yet. Add a vendor above to get started.
            </p>
          )}

          {vendors.map((vendor) => (
            <div key={vendor.id} className="border rounded-lg p-4 flex items-start justify-between gap-3" data-testid={`vendor-card-${vendor.id}`}>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold" data-testid={`text-vendor-name-${vendor.id}`}>{vendor.name}</h4>
                {vendor.address && (
                  <p className="text-sm text-muted-foreground mt-0.5" data-testid={`text-vendor-address-${vendor.id}`}>{vendor.address}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteVendorMutation.mutate(vendor.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                data-testid={`button-delete-vendor-${vendor.id}`}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Remove
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
