import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Navigation, Loader2, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationCaptureProps {
  latitude?: string | null;
  longitude?: string | null;
  onLocationCaptured: (lat: string, lng: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function LocationCapture({
  latitude,
  longitude,
  onLocationCaptured,
  isLoading = false,
  className,
}: LocationCaptureProps) {
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: string; lng: string } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  );

  useEffect(() => {
    if (latitude && longitude) {
      setCurrentLocation({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setCapturing(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setCurrentLocation({ lat, lng });
        onLocationCaptured(lat, lng);
        setCapturing(false);
      },
      (err) => {
        setCapturing(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location permission denied. Please enable location access in your browser settings.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location information unavailable. Please try again.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Please try again.");
            break;
          default:
            setError("Unable to get location. Please try again.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  const openInGoogleMaps = () => {
    if (currentLocation) {
      window.open(
        `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}`,
        "_blank"
      );
    }
  };

  return (
    <Card className={cn("", className)}>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="font-medium">GPS Location</span>
          </div>
          {currentLocation && (
            <Badge variant="outline" className="text-green-600">
              <Check className="w-3 h-3 mr-1" />
              GeoTagged
            </Badge>
          )}
        </div>

        {currentLocation ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-muted/50 rounded-md p-2">
                <span className="text-muted-foreground">Latitude</span>
                <p className="font-mono font-medium">{currentLocation.lat}</p>
              </div>
              <div className="bg-muted/50 rounded-md p-2">
                <span className="text-muted-foreground">Longitude</span>
                <p className="font-mono font-medium">{currentLocation.lng}</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={openInGoogleMaps}
                data-testid="button-view-google-maps"
              >
                <MapPin className="w-4 h-4 mr-1" />
                View on Google Maps
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={captureLocation}
                disabled={capturing || isLoading}
                data-testid="button-update-location"
              >
                {capturing ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Navigation className="w-4 h-4 mr-1" />
                )}
                Update Location
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Capture your current GPS location for map visibility
            </p>
            <Button
              onClick={captureLocation}
              disabled={capturing || isLoading}
              data-testid="button-capture-location"
            >
              {capturing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4 mr-2" />
              )}
              {capturing ? "Capturing..." : "Capture My Location"}
            </Button>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
