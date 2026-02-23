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
import { Plus, Trash2, Settings, Zap, Sun, X } from "lucide-react";

interface EquipmentMake {
  make: string;
  models: string[];
}

interface EquipmentOptions {
  moduleMakes: EquipmentMake[];
  inverterMakes: EquipmentMake[];
}

export default function EquipmentSettings() {
  const { toast } = useToast();
  const [newModuleMake, setNewModuleMake] = useState("");
  const [newModuleModel, setNewModuleModel] = useState("");
  const [editingModuleMake, setEditingModuleMake] = useState<string | null>(null);

  const [newInverterMake, setNewInverterMake] = useState("");
  const [newInverterModel, setNewInverterModel] = useState("");
  const [editingInverterMake, setEditingInverterMake] = useState<string | null>(null);

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

  const handleAddModel = (type: "module" | "inverter", make: string) => {
    const model = type === "module" ? newModuleModel.trim() : newInverterModel.trim();
    if (!model) return;

    const existing = type === "module" ? options?.moduleMakes : options?.inverterMakes;
    const entry = existing?.find(e => e.make === make);
    const currentModels = entry?.models || [];

    if (currentModels.includes(model)) {
      toast({ title: "Already exists", description: `${model} already exists.`, variant: "destructive" });
      return;
    }

    saveMutation.mutate({ type, make, models: [...currentModels, model] });
    if (type === "module") setNewModuleModel("");
    else setNewInverterModel("");
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
    setNewMake: (v: string) => void,
    newModel: string,
    setNewModel: (v: string) => void,
    editingMake: string | null,
    setEditingMake: (v: string | null) => void
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>
          Add makes and their models. These will appear as dropdown options in the MOA agreement form.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newMake}
            onChange={(e) => setNewMake(e.target.value)}
            placeholder={`Enter new ${type === "module" ? "solar module" : "inverter"} make name`}
            onKeyDown={(e) => e.key === "Enter" && handleAddMake(type)}
            data-testid={`input-new-${type}-make`}
          />
          <Button
            onClick={() => handleAddMake(type)}
            disabled={!newMake.trim() || saveMutation.isPending}
            data-testid={`button-add-${type}-make`}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Make
          </Button>
        </div>

        {makes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No {type === "module" ? "solar module" : "inverter"} makes added yet. Add a make above to get started.
          </p>
        )}

        {makes.map((entry) => (
          <div key={entry.make} className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm" data-testid={`text-${type}-make-${entry.make}`}>{entry.make}</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteMutation.mutate({ type, make: entry.make })}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                data-testid={`button-delete-${type}-make-${entry.make}`}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {entry.models.map((model) => (
                <Badge key={model} variant="secondary" className="gap-1 py-1 px-2" data-testid={`badge-${type}-model-${model}`}>
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
              {entry.models.length === 0 && (
                <span className="text-xs text-muted-foreground">No models added yet</span>
              )}
            </div>

            {editingMake === entry.make ? (
              <div className="flex gap-2">
                <Input
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  placeholder={`Add model for ${entry.make}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddModel(type, entry.make);
                    if (e.key === "Escape") setEditingMake(null);
                  }}
                  autoFocus
                  data-testid={`input-new-${type}-model`}
                />
                <Button
                  size="sm"
                  onClick={() => handleAddModel(type, entry.make)}
                  disabled={!newModel.trim() || saveMutation.isPending}
                  data-testid={`button-add-${type}-model`}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setEditingMake(null); setNewModel(""); }}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setEditingMake(entry.make); setNewModel(""); }}
                data-testid={`button-open-add-model-${type}-${entry.make}`}
              >
                <Plus className="w-4 h-4 mr-1" /> Add Model
              </Button>
            )}
          </div>
        ))}
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
          Configure solar module and inverter options that will appear in the MOA agreement form dropdown selections.
        </p>
      </div>

      <Separator />

      {renderEquipmentSection(
        "module",
        "Solar Module Makes & Models",
        <Sun className="w-5 h-5 text-yellow-500" />,
        options?.moduleMakes || [],
        newModuleMake,
        setNewModuleMake,
        newModuleModel,
        setNewModuleModel,
        editingModuleMake,
        setEditingModuleMake
      )}

      {renderEquipmentSection(
        "inverter",
        "Solar Inverter Makes & Models",
        <Zap className="w-5 h-5 text-blue-500" />,
        options?.inverterMakes || [],
        newInverterMake,
        setNewInverterMake,
        newInverterModel,
        setNewInverterModel,
        editingInverterMake,
        setEditingInverterMake
      )}
    </div>
  );
}
