import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Upload,
  X,
  Ruler,
  MapPin,
  RotateCw,
  Maximize2,
  Grid3X3,
  Download,
  Image,
  Loader2,
  Sun,
  ArrowRight,
  ArrowDown,
} from "lucide-react";

interface RoofSurveyProps {
  onDataChange?: (data: RoofSurveyData) => void;
  initialData?: Partial<RoofSurveyData>;
}

export interface RoofSurveyData {
  roofLength: string;
  roofBreadth: string;
  roofPhotos: string[];
  gpsLat?: string;
  gpsLng?: string;
}

export function RoofSurvey({ onDataChange, initialData }: RoofSurveyProps) {
  const [roofLength, setRoofLength] = useState(initialData?.roofLength || "");
  const [roofBreadth, setRoofBreadth] = useState(initialData?.roofBreadth || "");
  const [roofPhotos, setRoofPhotos] = useState<string[]>(initialData?.roofPhotos || []);
  const [isUploading, setIsUploading] = useState(false);
  const [gpsLat, setGpsLat] = useState(initialData?.gpsLat || "");
  const [gpsLng, setGpsLng] = useState(initialData?.gpsLng || "");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [showDiagram, setShowDiagram] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const notifyChange = useCallback(() => {
    onDataChange?.({
      roofLength,
      roofBreadth,
      roofPhotos,
      gpsLat,
      gpsLng,
    });
  }, [roofLength, roofBreadth, roofPhotos, gpsLat, gpsLng, onDataChange]);

  useEffect(() => {
    notifyChange();
  }, [roofLength, roofBreadth, roofPhotos, gpsLat, gpsLng]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (roofPhotos.length + files.length > 6) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("documents", file));
      const response = await fetch("/api/uploads/documents", {
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        const result = await response.json();
        setRoofPhotos((prev) => [...prev, ...(result.urls || [])]);
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    setRoofPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const getLocation = () => {
    if (!navigator.geolocation) return;
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLat(pos.coords.latitude.toFixed(6));
        setGpsLng(pos.coords.longitude.toFixed(6));
        setIsGettingLocation(false);
      },
      () => setIsGettingLocation(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const computedArea = (() => {
    const l = parseFloat(roofLength);
    const b = parseFloat(roofBreadth);
    if (!isNaN(l) && !isNaN(b) && l > 0 && b > 0) return l * b;
    return 0;
  })();

  const panelsFit = (() => {
    if (computedArea <= 0) return 0;
    const panelArea = 21.5;
    return Math.floor(computedArea / panelArea);
  })();

  const estimatedCapacity = ((panelsFit * 545) / 1000).toFixed(1);

  useEffect(() => {
    if (!showDiagram || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const l = parseFloat(roofLength) || 20;
    const b = parseFloat(roofBreadth) || 15;

    const padding = 60;
    const availW = canvas.width - padding * 2;
    const availH = canvas.height - padding * 2;
    const scale = Math.min(availW / l, availH / b);
    const roofW = l * scale;
    const roofH = b * scale;
    const startX = (canvas.width - roofW) / 2;
    const startY = (canvas.height - roofH) / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 0.5;
    const gridSize = scale;
    for (let x = startX; x <= startX + roofW; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + roofH);
      ctx.stroke();
    }
    for (let y = startY; y <= startY + roofH; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(startX + roofW, y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(startX, startY, roofW, roofH);
    ctx.strokeStyle = "#0ea5e9";
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, roofW, roofH);

    const panelW = 1.1 * scale;
    const panelH = 2.3 * scale;
    const gap = 0.15 * scale;
    const cols = Math.floor(roofW / (panelW + gap));
    const rows = Math.floor(roofH / (panelH + gap));
    const totalOffsetX = (roofW - cols * (panelW + gap) + gap) / 2;
    const totalOffsetY = (roofH - rows * (panelH + gap) + gap) / 2;

    let count = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const px = startX + totalOffsetX + c * (panelW + gap);
        const py = startY + totalOffsetY + r * (panelH + gap);
        ctx.fillStyle = "#1e40af";
        ctx.fillRect(px, py, panelW, panelH);
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, panelW, panelH);

        ctx.beginPath();
        ctx.moveTo(px, py + panelH / 2);
        ctx.lineTo(px + panelW, py + panelH / 2);
        ctx.strokeStyle = "#93c5fd";
        ctx.lineWidth = 0.3;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(px + panelW / 2, py);
        ctx.lineTo(px + panelW / 2, py + panelH);
        ctx.stroke();

        count++;
      }
    }

    ctx.fillStyle = "#f97316";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";

    const dimY = startY + roofH + 30;
    ctx.beginPath();
    ctx.moveTo(startX, dimY - 5);
    ctx.lineTo(startX, dimY + 5);
    ctx.moveTo(startX, dimY);
    ctx.lineTo(startX + roofW, dimY);
    ctx.moveTo(startX + roofW, dimY - 5);
    ctx.lineTo(startX + roofW, dimY + 5);
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillText(`${l} ft`, startX + roofW / 2, dimY + 18);

    const dimX = startX - 30;
    ctx.beginPath();
    ctx.moveTo(dimX - 5, startY);
    ctx.lineTo(dimX + 5, startY);
    ctx.moveTo(dimX, startY);
    ctx.lineTo(dimX, startY + roofH);
    ctx.moveTo(dimX - 5, startY + roofH);
    ctx.lineTo(dimX + 5, startY + roofH);
    ctx.strokeStyle = "#f97316";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.save();
    ctx.translate(dimX - 15, startY + roofH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${b} ft`, 0, 0);
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "left";
    ctx.fillText("ROOF LAYOUT PLAN", 15, 25);

    ctx.font = "11px monospace";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`Area: ${(l * b).toFixed(0)} sq.ft`, 15, 45);
    ctx.fillText(`Panels: ${count} × 545W`, 15, 62);
    ctx.fillText(`Capacity: ${((count * 545) / 1000).toFixed(1)} kW`, 15, 79);

    if (gpsLat && gpsLng) {
      ctx.fillText(`GPS: ${gpsLat}, ${gpsLng}`, 15, 96);
    }

    ctx.fillStyle = "#475569";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText("DivyanshiSolar AutoCAD Layout", canvas.width - 15, canvas.height - 10);
    ctx.fillText(`Scale: 1 unit = 1 ft`, canvas.width - 15, canvas.height - 25);

    ctx.strokeStyle = "#0ea5e9";
    ctx.lineWidth = 1;
    const compassX = canvas.width - 45;
    const compassY = 50;
    ctx.beginPath();
    ctx.moveTo(compassX, compassY - 20);
    ctx.lineTo(compassX, compassY + 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(compassX - 20, compassY);
    ctx.lineTo(compassX + 20, compassY);
    ctx.stroke();
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("N", compassX, compassY - 25);
    ctx.fillStyle = "#64748b";
    ctx.fillText("S", compassX, compassY + 35);
    ctx.fillText("E", compassX + 28, compassY + 4);
    ctx.fillText("W", compassX - 28, compassY + 4);
  }, [showDiagram, roofLength, roofBreadth, gpsLat, gpsLng]);

  const downloadDiagram = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `roof-layout-${roofLength}x${roofBreadth}ft.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4" />
            Roof Length (ft)
          </Label>
          <Input
            type="number"
            placeholder="e.g., 30"
            value={roofLength}
            onChange={(e) => setRoofLength(e.target.value)}
            data-testid="input-roof-length"
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <ArrowDown className="w-4 h-4" />
            Roof Breadth (ft)
          </Label>
          <Input
            type="number"
            placeholder="e.g., 20"
            value={roofBreadth}
            onChange={(e) => setRoofBreadth(e.target.value)}
            data-testid="input-roof-breadth"
          />
        </div>
      </div>

      {computedArea > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Roof Area</p>
            <p className="text-lg font-bold text-blue-600">{computedArea.toFixed(0)} sq.ft</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Panels Fit</p>
            <p className="text-lg font-bold text-green-600">{panelsFit}</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Est. Capacity</p>
            <p className="text-lg font-bold text-orange-600">{estimatedCapacity} kW</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          GPS Location
        </Label>
        <div className="flex gap-2">
          <Input
            placeholder="Latitude"
            value={gpsLat}
            onChange={(e) => setGpsLat(e.target.value)}
            className="flex-1"
            data-testid="input-roof-gps-lat"
          />
          <Input
            placeholder="Longitude"
            value={gpsLng}
            onChange={(e) => setGpsLng(e.target.value)}
            className="flex-1"
            data-testid="input-roof-gps-lng"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={getLocation}
            disabled={isGettingLocation}
            data-testid="button-get-roof-gps"
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
          </Button>
        </div>
        {gpsLat && gpsLng && (
          <p className="text-xs text-green-600">
            Location captured: {gpsLat}, {gpsLng}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Roof Photos ({roofPhotos.length}/6)
        </Label>

        {roofPhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {roofPhotos.map((url, index) => (
              <div
                key={index}
                className="relative group rounded-lg overflow-hidden border"
                data-testid={`roof-photo-${index}`}
              >
                <img
                  src={url}
                  alt={`Roof photo ${index + 1}`}
                  className="w-full h-28 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid={`button-remove-roof-photo-${index}`}
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs text-center py-0.5">
                  {index === 0
                    ? "Front View"
                    : index === 1
                    ? "Top View"
                    : index === 2
                    ? "Left Side"
                    : index === 3
                    ? "Right Side"
                    : index === 4
                    ? "Obstacles"
                    : "Extra"}
                </div>
              </div>
            ))}
          </div>
        )}

        {roofPhotos.length < 6 && (
          <label
            className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-4 cursor-pointer hover:border-primary transition-colors"
            data-testid="upload-roof-photos-area"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoUpload}
              data-testid="input-roof-photos"
            />
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-1" />
            ) : (
              <Camera className="w-8 h-8 text-muted-foreground mb-1" />
            )}
            <p className="text-sm font-medium">
              {isUploading ? "Uploading..." : "Take photo or upload"}
            </p>
            <p className="text-xs text-muted-foreground">
              Front, Top, Left, Right, Obstacles, Extra
            </p>
          </label>
        )}
      </div>

      {computedArea > 0 && (
        <div className="space-y-3">
          <Button
            type="button"
            variant={showDiagram ? "secondary" : "outline"}
            className="w-full"
            onClick={() => setShowDiagram(!showDiagram)}
            data-testid="button-toggle-autocad"
          >
            <Grid3X3 className="w-4 h-4 mr-2" />
            {showDiagram
              ? "Hide AutoCAD Layout"
              : "Generate AutoCAD Roof Layout"}
          </Button>

          {showDiagram && (
            <div className="space-y-2">
              <div className="rounded-lg overflow-hidden border bg-[#1a1a2e]">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={450}
                  className="w-full"
                  data-testid="canvas-autocad-layout"
                />
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Ruler className="w-3 h-3 mr-1" />
                    {roofLength} × {roofBreadth} ft
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Sun className="w-3 h-3 mr-1" />
                    {panelsFit} panels
                  </Badge>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadDiagram}
                  data-testid="button-download-layout"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
