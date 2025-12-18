import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GripVertical, Settings, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserPreferences } from "@shared/schema";

export interface DashboardWidget {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}

interface DashboardWidgetConfig {
  bdp: DashboardWidget[];
  ddp: DashboardWidget[];
}

const defaultWidgets: DashboardWidgetConfig = {
  bdp: [
    { id: "stats", title: "Statistics Overview", visible: true, order: 0 },
    { id: "partner-of-month", title: "Partner of the Month", visible: true, order: 1 },
    { id: "recent-partners", title: "Recent Partners", visible: true, order: 2 },
    { id: "recent-customers", title: "Recent Customers", visible: true, order: 3 },
    { id: "commissions", title: "Commission Summary", visible: true, order: 4 },
  ],
  ddp: [
    { id: "stats", title: "Statistics Overview", visible: true, order: 0 },
    { id: "partner-of-month", title: "Partner of the Month", visible: true, order: 1 },
    { id: "recent-customers", title: "Recent Customers", visible: true, order: 2 },
    { id: "commissions", title: "Commission Summary", visible: true, order: 3 },
    { id: "quick-actions", title: "Quick Actions", visible: true, order: 4 },
  ],
};

export function useDashboardWidgets(role: "bdp" | "ddp") {
  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences"],
  });

  const [widgets, setWidgets] = useState<DashboardWidget[]>(defaultWidgets[role]);

  useEffect(() => {
    if (preferences?.dashboardLayout) {
      try {
        const savedLayout = JSON.parse(preferences.dashboardLayout) as DashboardWidget[];
        const roleWidgets = savedLayout.filter(w => 
          defaultWidgets[role].some(dw => dw.id === w.id)
        );
        if (roleWidgets.length > 0) {
          const mergedWidgets = defaultWidgets[role].map(dw => {
            const saved = roleWidgets.find(sw => sw.id === dw.id);
            return saved || dw;
          });
          setWidgets(mergedWidgets.sort((a, b) => a.order - b.order));
        }
      } catch {
        setWidgets(defaultWidgets[role]);
      }
    } else {
      setWidgets(defaultWidgets[role]);
    }
  }, [preferences, role]);

  return {
    widgets,
    setWidgets,
    visibleWidgets: widgets.filter(w => w.visible).sort((a, b) => a.order - b.order),
    isWidgetVisible: (id: string) => widgets.find(w => w.id === id)?.visible ?? true,
  };
}

interface DashboardCustomizerProps {
  role: "bdp" | "ddp";
  widgets: DashboardWidget[];
  onWidgetsChange: (widgets: DashboardWidget[]) => void;
}

export function DashboardCustomizer({ role, widgets, onWidgetsChange }: DashboardCustomizerProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [localWidgets, setLocalWidgets] = useState(widgets);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    setLocalWidgets(widgets);
  }, [widgets]);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (layout: DashboardWidget[]) => {
      await apiRequest("PATCH", "/api/preferences", {
        dashboardLayout: JSON.stringify(layout),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences"] });
      toast({
        title: "Dashboard saved",
        description: "Your dashboard layout has been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save dashboard layout",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (id: string) => {
    setLocalWidgets(prev =>
      prev.map(w => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const handleDragStart = (id: string) => {
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    setLocalWidgets(prev => {
      const items = [...prev];
      const draggedIndex = items.findIndex(w => w.id === draggedItem);
      const targetIndex = items.findIndex(w => w.id === targetId);
      
      const [removed] = items.splice(draggedIndex, 1);
      items.splice(targetIndex, 0, removed);
      
      return items.map((w, i) => ({ ...w, order: i }));
    });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleSave = () => {
    onWidgetsChange(localWidgets);
    updatePreferencesMutation.mutate(localWidgets);
    setOpen(false);
  };

  const handleReset = () => {
    setLocalWidgets(defaultWidgets[role]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-customize-dashboard">
          <Settings className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
          <DialogDescription>
            Show, hide, and reorder dashboard widgets. Drag items to change their order.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          {localWidgets.map((widget) => (
            <div
              key={widget.id}
              draggable
              onDragStart={() => handleDragStart(widget.id)}
              onDragOver={(e) => handleDragOver(e, widget.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 rounded-md border ${
                draggedItem === widget.id ? "opacity-50 border-primary" : ""
              } hover-elevate cursor-move`}
              data-testid={`widget-config-${widget.id}`}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <Label htmlFor={widget.id} className="flex-1 cursor-pointer">
                {widget.title}
              </Label>
              <Switch
                id={widget.id}
                checked={widget.visible}
                onCheckedChange={() => handleToggle(widget.id)}
              />
            </div>
          ))}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={updatePreferencesMutation.isPending} className="w-full sm:w-auto">
            <Check className="h-4 w-4 mr-2" />
            Save Layout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
