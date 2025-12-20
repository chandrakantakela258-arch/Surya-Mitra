import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MapPin, Zap, Calendar, Camera, Video, Play, Sun } from "lucide-react";
import type { Customer } from "@shared/schema";

const solarIcon = L.divIcon({
  className: "solar-marker",
  html: `<div style="
    background: linear-gradient(135deg, #f97316, #ea580c);
    border: 3px solid white;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  ">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

export default function InstallationMap() {
  const [selectedInstallation, setSelectedInstallation] = useState<Customer | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState(false);

  const { data: installations, isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/public/installations-map"],
  });

  const installationsWithCoords = installations?.filter(
    (c) => c.latitude && c.longitude && c.status === "completed"
  ) || [];

  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const defaultZoom = 5;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Installation Map</h1>
          <p className="text-muted-foreground">Loading installations...</p>
        </div>
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <Sun className="w-6 h-6 text-orange-500" />
          Divyanshi Solar Installations
        </h1>
        <p className="text-muted-foreground">
          PM Surya Ghar Yojana - Completed Rooftop Solar Installations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-orange-600">{installationsWithCoords.length}</p>
            <p className="text-sm text-muted-foreground">Mapped Installations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">
              {installationsWithCoords.reduce((sum, c) => sum + (parseFloat(c.proposedCapacity || "0") || 0), 0)} kW
            </p>
            <p className="text-sm text-muted-foreground">Total Capacity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">
              {installationsWithCoords.filter(c => c.sitePictures && c.sitePictures.length > 0).length}
            </p>
            <p className="text-sm text-muted-foreground">With Site Pictures</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold">
              {installationsWithCoords.filter(c => c.siteVideo).length}
            </p>
            <p className="text-sm text-muted-foreground">With Site Video</p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Installation Locations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] w-full">
            <MapContainer
              center={defaultCenter}
              zoom={defaultZoom}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {installationsWithCoords.map((installation) => (
                <Marker
                  key={installation.id}
                  position={[
                    parseFloat(installation.latitude || "0"),
                    parseFloat(installation.longitude || "0"),
                  ]}
                  icon={solarIcon}
                  eventHandlers={{
                    click: () => setSelectedInstallation(installation),
                  }}
                >
                  <Popup>
                    <div className="min-w-[200px] space-y-2">
                      <div className="font-bold text-orange-600">
                        Divyanshi Solar Installation
                      </div>
                      <div className="text-xs font-medium text-green-700">
                        Under PM Surya Ghar Yojana
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Zap className="w-3 h-3" />
                        <span className="font-semibold">{installation.proposedCapacity} kW</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3" />
                        <span>{installation.district}, {installation.state}</span>
                      </div>
                      {installation.installationDate && (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(installation.installationDate).toLocaleDateString("en-IN")}</span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        {installation.sitePictures && installation.sitePictures.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            <Camera className="w-3 h-3 mr-1" />
                            {installation.sitePictures.length} pics
                          </Badge>
                        )}
                        {installation.siteVideo && (
                          <Badge variant="outline" className="text-xs">
                            <Video className="w-3 h-3 mr-1" />
                            Video
                          </Badge>
                        )}
                      </div>
                      <button
                        className="w-full mt-2 px-3 py-1 bg-orange-500 text-white rounded text-sm font-medium hover:bg-orange-600 transition-colors"
                        onClick={() => setSelectedInstallation(installation)}
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {installationsWithCoords.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No installations with location data available yet.
        </div>
      )}

      <Dialog open={!!selectedInstallation} onOpenChange={() => setSelectedInstallation(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Sun className="w-5 h-5" />
              Divyanshi Solar Installation
            </DialogTitle>
            <DialogDescription>
              PM Surya Ghar Yojana - Rooftop Solar Installation
            </DialogDescription>
          </DialogHeader>
          {selectedInstallation && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedInstallation.address}</p>
                  <p className="text-sm">{selectedInstallation.district}, {selectedInstallation.state}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">System Capacity</p>
                  <p className="text-2xl font-bold text-orange-600">{selectedInstallation.proposedCapacity} kW</p>
                  <Badge variant={selectedInstallation.panelType === "dcr" ? "default" : "secondary"}>
                    {selectedInstallation.panelType === "dcr" ? "DCR Panel" : "Non-DCR Panel"}
                  </Badge>
                </div>
              </div>

              {selectedInstallation.installationDate && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Installed on {new Date(selectedInstallation.installationDate).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
              )}

              {selectedInstallation.sitePictures && selectedInstallation.sitePictures.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    Site Pictures
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedInstallation.sitePictures.map((url, index) => (
                      <div
                        key={index}
                        className="aspect-square rounded-md overflow-hidden cursor-pointer hover-elevate"
                        onClick={() => setPreviewImage(url)}
                      >
                        <img
                          src={url}
                          alt={`Site picture ${index + 1}`}
                          className="w-full h-full object-cover"
                          data-testid={`img-installation-picture-${index}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedInstallation.siteVideo && (
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Site Video
                  </h4>
                  <div
                    className="relative aspect-[9/16] max-w-[200px] bg-muted rounded-md overflow-hidden cursor-pointer"
                    onClick={() => setPreviewVideo(true)}
                  >
                    <video
                      src={selectedInstallation.siteVideo}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t text-center text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Divyanshi Digital Services Pvt. Ltd.</p>
                <p>CIN: U93090BR2017PTC036522</p>
                <p>Authorized PM Surya Ghar Yojana Partner</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Installation Site Picture</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img src={previewImage} alt="Site preview" className="w-full rounded-md" />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={previewVideo} onOpenChange={setPreviewVideo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Installation Site Video</DialogTitle>
            <DialogDescription>
              {selectedInstallation?.proposedCapacity} kW - {selectedInstallation?.district}, {selectedInstallation?.state}
            </DialogDescription>
          </DialogHeader>
          {selectedInstallation?.siteVideo && (
            <video
              src={selectedInstallation.siteVideo}
              controls
              autoPlay
              className="w-full aspect-[9/16] rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
