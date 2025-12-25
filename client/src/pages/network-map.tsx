import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { MapPin, Zap, Calendar, Camera, Video, Play, Sun, Users, Building, Clock, CheckCircle, Loader2, Phone, Navigation } from "lucide-react";
import type { Customer, User } from "@shared/schema";

const INDIA_DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  "Patna": { lat: 25.5941, lng: 85.1376 },
  "Gaya": { lat: 24.7914, lng: 85.0002 },
  "Muzaffarpur": { lat: 26.1209, lng: 85.3647 },
  "Bhagalpur": { lat: 25.2425, lng: 86.9842 },
  "Purnia": { lat: 25.7771, lng: 87.4753 },
  "Darbhanga": { lat: 26.1542, lng: 85.8918 },
  "Begusarai": { lat: 25.4182, lng: 86.1272 },
  "Samastipur": { lat: 25.8629, lng: 85.7810 },
  "Nalanda": { lat: 25.1340, lng: 85.4434 },
  "Bhubaneswar": { lat: 20.2961, lng: 85.8245 },
  "Cuttack": { lat: 20.4625, lng: 85.8830 },
  "Rourkela": { lat: 22.2604, lng: 84.8536 },
  "Puri": { lat: 19.8135, lng: 85.8312 },
  "Sambalpur": { lat: 21.4669, lng: 83.9812 },
  "Lucknow": { lat: 26.8467, lng: 80.9462 },
  "Kanpur": { lat: 26.4499, lng: 80.3319 },
  "Varanasi": { lat: 25.3176, lng: 82.9739 },
  "Agra": { lat: 27.1767, lng: 78.0081 },
  "Prayagraj": { lat: 25.4358, lng: 81.8463 },
  "Gorakhpur": { lat: 26.7606, lng: 83.3732 },
  "Ranchi": { lat: 23.3441, lng: 85.3096 },
  "Jamshedpur": { lat: 22.8046, lng: 86.2029 },
  "Dhanbad": { lat: 23.7957, lng: 86.4304 },
  "Bokaro": { lat: 23.6693, lng: 86.1511 },
  "Kolkata": { lat: 22.5726, lng: 88.3639 },
  "Howrah": { lat: 22.5958, lng: 88.2636 },
  "Siliguri": { lat: 26.7271, lng: 88.3953 },
  "Asansol": { lat: 23.6889, lng: 86.9661 },
  "Durgapur": { lat: 23.5204, lng: 87.3119 },
  "Mumbai": { lat: 19.0760, lng: 72.8777 },
  "Delhi": { lat: 28.6139, lng: 77.2090 },
  "Bangalore": { lat: 12.9716, lng: 77.5946 },
  "Hyderabad": { lat: 17.3850, lng: 78.4867 },
  "Chennai": { lat: 13.0827, lng: 80.2707 },
  "Ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "Pune": { lat: 18.5204, lng: 73.8567 },
  "Jaipur": { lat: 26.9124, lng: 75.7873 },
  "Surat": { lat: 21.1702, lng: 72.8311 },
  "Bhopal": { lat: 23.2599, lng: 77.4126 },
  "Indore": { lat: 22.7196, lng: 75.8577 },
  "Nagpur": { lat: 21.1458, lng: 79.0882 },
};

const solarIcon = L.divIcon({
  className: "solar-marker",
  html: `<div style="
    background: linear-gradient(135deg, #f97316, #ea580c);
    border: 3px solid white;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  ">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const ongoingIcon = L.divIcon({
  className: "ongoing-marker",
  html: `<div style="
    background: linear-gradient(135deg, #eab308, #ca8a04);
    border: 3px solid white;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  ">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const bdpIcon = L.divIcon({
  className: "bdp-marker",
  html: `<div style="
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
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
      <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
    </svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

const ddpIcon = L.divIcon({
  className: "ddp-marker",
  html: `<div style="
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: 3px solid white;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  ">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

type PartnerMapData = {
  id: string;
  name: string;
  role: string;
  district: string | null;
  state: string | null;
  latitude: string | null;
  longitude: string | null;
  phone: string | null;
};

type InstallationMapData = {
  id: string;
  state: string;
  district: string;
  address: string;
  proposedCapacity: string | null;
  panelType: string | null;
  latitude: string | null;
  longitude: string | null;
  installationDate: Date | null;
  sitePictures: string[] | null;
  siteVideo: string | null;
  status: string;
};

export default function NetworkMap() {
  const [selectedInstallation, setSelectedInstallation] = useState<InstallationMapData | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [showOngoing, setShowOngoing] = useState(true);
  const [showPartners, setShowPartners] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const { data: allInstallations, isLoading: loadingInstallations } = useQuery<InstallationMapData[]>({
    queryKey: ["/api/public/all-installations-map"],
  });

  const { data: partners, isLoading: loadingPartners } = useQuery<PartnerMapData[]>({
    queryKey: ["/api/public/partner-network-map"],
  });

  const completedInstallations = allInstallations?.filter(c => c.status === "completed" && c.latitude && c.longitude) || [];
  const ongoingInstallations = allInstallations?.filter(c => c.status !== "completed" && c.latitude && c.longitude) || [];
  
  const bdpPartners = partners?.filter(p => p.role === "bdp") || [];
  const ddpPartners = partners?.filter(p => p.role === "ddp") || [];

  const getPartnerCoords = (partner: PartnerMapData): [number, number] | null => {
    if (partner.latitude && partner.longitude) {
      return [parseFloat(partner.latitude), parseFloat(partner.longitude)];
    }
    if (partner.district && INDIA_DISTRICT_COORDS[partner.district]) {
      const coords = INDIA_DISTRICT_COORDS[partner.district];
      const jitter = (Math.random() - 0.5) * 0.1;
      return [coords.lat + jitter, coords.lng + jitter];
    }
    return null;
  };

  const defaultCenter: [number, number] = [22.5937, 82.9629];
  const defaultZoom = 5;

  const isLoading = loadingInstallations || loadingPartners;

  if (isLoading) {
    return (
      <div className="space-y-6 p-4">
        <div>
          <h1 className="text-2xl font-bold">Partner Network & Installations</h1>
          <p className="text-muted-foreground">Loading map data...</p>
        </div>
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="text-page-title">
          <MapPin className="w-6 h-6 text-primary" />
          Partner Network & Solar Installations
        </h1>
        <p className="text-muted-foreground">
          Interactive map showing our partner network and installation progress across India
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="installations" data-testid="tab-installations">Installations</TabsTrigger>
          <TabsTrigger value="partners" data-testid="tab-partners">Partners</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-orange-600">{completedInstallations.length}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-yellow-600">{ongoingInstallations.length}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" /> Ongoing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">
              {completedInstallations.reduce((sum, c) => sum + (parseFloat(c.proposedCapacity || "0") || 0), 0)} kW
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3" /> Total Capacity
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-blue-600">{bdpPartners.length}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Building className="w-3 h-3" /> BDP Partners
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-emerald-600">{ddpPartners.length}</p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="w-3 h-3" /> DDP Partners
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-6 items-center">
        <div className="flex items-center gap-2">
          <Switch
            id="show-completed"
            checked={showCompleted}
            onCheckedChange={setShowCompleted}
            data-testid="switch-completed"
          />
          <Label htmlFor="show-completed" className="flex items-center gap-1 cursor-pointer">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            Completed ({completedInstallations.length})
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="show-ongoing"
            checked={showOngoing}
            onCheckedChange={setShowOngoing}
            data-testid="switch-ongoing"
          />
          <Label htmlFor="show-ongoing" className="flex items-center gap-1 cursor-pointer">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            Ongoing ({ongoingInstallations.length})
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="show-partners"
            checked={showPartners}
            onCheckedChange={setShowPartners}
            data-testid="switch-partners"
          />
          <Label htmlFor="show-partners" className="flex items-center gap-1 cursor-pointer">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            Partners ({partners?.length || 0})
          </Label>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Network Map
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
              
              {(activeTab === "all" || activeTab === "installations") && showCompleted && completedInstallations.map((installation) => (
                <Marker
                  key={`completed-${installation.id}`}
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
                        Completed Installation
                      </div>
                      <Badge className="bg-green-500">Completed</Badge>
                      <div className="flex items-center gap-1 text-sm">
                        <Zap className="w-3 h-3" />
                        <span className="font-semibold">{installation.proposedCapacity} kW</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3" />
                        <span>{installation.district}, {installation.state}</span>
                      </div>
                      <button
                        className="w-full mt-2 px-3 py-1 bg-orange-500 text-white rounded text-sm font-medium"
                        onClick={() => setSelectedInstallation(installation)}
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {(activeTab === "all" || activeTab === "installations") && showOngoing && ongoingInstallations.map((installation) => (
                <Marker
                  key={`ongoing-${installation.id}`}
                  position={[
                    parseFloat(installation.latitude || "0"),
                    parseFloat(installation.longitude || "0"),
                  ]}
                  icon={ongoingIcon}
                  eventHandlers={{
                    click: () => setSelectedInstallation(installation),
                  }}
                >
                  <Popup>
                    <div className="min-w-[200px] space-y-2">
                      <div className="font-bold text-yellow-600">
                        Ongoing Installation
                      </div>
                      <Badge className="bg-yellow-500">{installation.status}</Badge>
                      <div className="flex items-center gap-1 text-sm">
                        <Zap className="w-3 h-3" />
                        <span className="font-semibold">{installation.proposedCapacity} kW</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="w-3 h-3" />
                        <span>{installation.district}, {installation.state}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {(activeTab === "all" || activeTab === "partners") && showPartners && bdpPartners.map((partner) => {
                const coords = getPartnerCoords(partner);
                if (!coords) return null;
                const hasGPS = partner.latitude && partner.longitude;
                return (
                  <Marker
                    key={`bdp-${partner.id}`}
                    position={coords}
                    icon={bdpIcon}
                  >
                    <Popup>
                      <div className="min-w-[180px] space-y-2">
                        <div className="font-bold text-blue-600">
                          Business Development Partner
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500">BDP</Badge>
                          {hasGPS && (
                            <Badge variant="outline" className="text-green-600 text-xs">
                              <Navigation className="w-2 h-2 mr-1" />
                              GPS
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm font-medium">{partner.name}</div>
                        {partner.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3" />
                            <a href={`tel:${partner.phone}`} className="text-blue-600">{partner.phone}</a>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{partner.district}, {partner.state}</span>
                        </div>
                        {hasGPS && (
                          <a 
                            href={`https://www.google.com/maps?q=${partner.latitude},${partner.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 underline"
                          >
                            Open in Google Maps
                          </a>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
              
              {(activeTab === "all" || activeTab === "partners") && showPartners && ddpPartners.map((partner) => {
                const coords = getPartnerCoords(partner);
                if (!coords) return null;
                const hasGPS = partner.latitude && partner.longitude;
                return (
                  <Marker
                    key={`ddp-${partner.id}`}
                    position={coords}
                    icon={ddpIcon}
                  >
                    <Popup>
                      <div className="min-w-[180px] space-y-2">
                        <div className="font-bold text-green-600">
                          District Development Partner
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500">DDP</Badge>
                          {hasGPS && (
                            <Badge variant="outline" className="text-green-600 text-xs">
                              <Navigation className="w-2 h-2 mr-1" />
                              GPS
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm font-medium">{partner.name}</div>
                        {partner.phone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="w-3 h-3" />
                            <a href={`tel:${partner.phone}`} className="text-green-600">{partner.phone}</a>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span>{partner.district}, {partner.state}</span>
                        </div>
                        {hasGPS && (
                          <a 
                            href={`https://www.google.com/maps?q=${partner.latitude},${partner.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 underline"
                          >
                            Open in Google Maps
                          </a>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white shadow" />
          <span>Completed Installation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-white shadow" />
          <span>Ongoing Installation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white shadow" />
          <span>BDP Partner</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-green-600 border-2 border-white shadow" />
          <span>DDP Partner</span>
        </div>
      </div>

      <Dialog open={!!selectedInstallation} onOpenChange={() => setSelectedInstallation(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Sun className="w-5 h-5" />
              Solar Installation Details
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
                  <p className="text-sm text-muted-foreground">System Details</p>
                  <p className="text-2xl font-bold text-orange-600">{selectedInstallation.proposedCapacity} kW</p>
                  <div className="flex gap-2">
                    <Badge variant={selectedInstallation.panelType === "dcr" ? "default" : "secondary"}>
                      {selectedInstallation.panelType === "dcr" ? "DCR Panel" : "Non-DCR Panel"}
                    </Badge>
                    <Badge variant={selectedInstallation.status === "completed" ? "default" : "outline"}>
                      {selectedInstallation.status}
                    </Badge>
                  </div>
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
                <p>Authorized PM Surya Ghar Yojana Partner</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Site Picture</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <img src={previewImage} alt="Site preview" className="w-full rounded-md" />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={previewVideo} onOpenChange={setPreviewVideo}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Site Video</DialogTitle>
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
