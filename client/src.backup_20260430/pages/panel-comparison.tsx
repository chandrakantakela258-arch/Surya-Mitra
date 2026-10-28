import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link as WouterLink } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Zap, Scale, Check, X } from "lucide-react";
import type { PanelModel } from "@shared/schema";

export default function PanelComparisonPage() {
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
  
  const { data: panels, isLoading } = useQuery<PanelModel[]>({
    queryKey: ["/api/public/panels"],
  });

  const togglePanel = (id: string) => {
    setSelectedPanels((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectedModels = panels?.filter((p) => selectedPanels.includes(p.id)) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <WouterLink href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </WouterLink>
            <h1 className="text-xl font-bold">Solar Panel Comparison</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Compare Solar Panels</h2>
          <p className="text-muted-foreground">
            Select panels to compare their specifications, features, and pricing
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : panels && panels.length > 0 ? (
          <>
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Select Panels to Compare</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {panels.map((panel) => (
                  <Card
                    key={panel.id}
                    className={`cursor-pointer transition-all ${
                      selectedPanels.includes(panel.id)
                        ? "ring-2 ring-primary"
                        : "hover-elevate"
                    }`}
                    onClick={() => togglePanel(panel.id)}
                    data-testid={`card-panel-${panel.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge variant={panel.type === "dcr" ? "default" : "secondary"}>
                            {panel.type === "dcr" ? "DCR" : "Non-DCR"}
                          </Badge>
                          <CardTitle className="text-lg mt-2">{panel.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{panel.brand}</p>
                        </div>
                        <Checkbox
                          checked={selectedPanels.includes(panel.id)}
                          onCheckedChange={() => togglePanel(panel.id)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span>{panel.capacityWatt}W</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Scale className="w-4 h-4 text-muted-foreground" />
                          <span>{panel.efficiency || "N/A"}</span>
                        </div>
                      </div>
                      {panel.pricePerWatt && (
                        <p className="mt-2 text-sm font-medium">
                          Rs {panel.pricePerWatt}/Watt
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {selectedModels.length >= 2 && (
              <Card className="overflow-x-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="w-5 h-5" />
                    Comparison Table
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-40">Specification</TableHead>
                        {selectedModels.map((panel) => (
                          <TableHead key={panel.id}>{panel.name}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Brand</TableCell>
                        {selectedModels.map((panel) => (
                          <TableCell key={panel.id}>{panel.brand}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Type</TableCell>
                        {selectedModels.map((panel) => (
                          <TableCell key={panel.id}>
                            <Badge variant={panel.type === "dcr" ? "default" : "secondary"}>
                              {panel.type === "dcr" ? "DCR" : "Non-DCR"}
                            </Badge>
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Capacity</TableCell>
                        {selectedModels.map((panel) => (
                          <TableCell key={panel.id}>{panel.capacityWatt}W</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Efficiency</TableCell>
                        {selectedModels.map((panel) => (
                          <TableCell key={panel.id}>{panel.efficiency || "N/A"}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Technology</TableCell>
                        {selectedModels.map((panel) => (
                          <TableCell key={panel.id}>{panel.technology || "N/A"}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Warranty</TableCell>
                        {selectedModels.map((panel) => (
                          <TableCell key={panel.id}>{panel.warranty || "N/A"}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Dimensions</TableCell>
                        {selectedModels.map((panel) => (
                          <TableCell key={panel.id}>{panel.dimensions || "N/A"}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Weight</TableCell>
                        {selectedModels.map((panel) => (
                          <TableCell key={panel.id}>{panel.weight || "N/A"}</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Price/Watt</TableCell>
                        {selectedModels.map((panel) => (
                          <TableCell key={panel.id} className="font-semibold text-primary">
                            {panel.pricePerWatt ? `Rs ${panel.pricePerWatt}` : "N/A"}
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Subsidy Eligible</TableCell>
                        {selectedModels.map((panel) => (
                          <TableCell key={panel.id}>
                            {panel.type === "dcr" ? (
                              <Check className="w-5 h-5 text-green-500" />
                            ) : (
                              <X className="w-5 h-5 text-red-500" />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {selectedModels.length === 1 && (
              <p className="text-center text-muted-foreground py-4">
                Select at least 2 panels to compare
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No panel models available for comparison</p>
          </div>
        )}
      </main>
    </div>
  );
}
