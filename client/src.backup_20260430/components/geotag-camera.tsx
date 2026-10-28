import { useEffect, useRef, useState } from "react";
import { X, Camera, Loader2, Navigation, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GeotagCameraProps {
  onCapture: (blob: Blob, gps: { lat: string; lng: string } | null) => void;
  onClose: () => void;
  addressLine?: string;
}

export function GeotagCamera({ onCapture, onClose, addressLine }: GeotagCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const gpsRef = useRef<{ lat: string; lng: string } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"getting" | "got" | "failed">("getting");
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current!.play();
            setReady(true);
          };
        }
      }).catch(() => onClose());

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        gpsRef.current = { lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) };
        setGpsStatus("got");
      },
      () => setGpsStatus("failed"),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const drawOverlay = (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const gps = gpsRef.current;
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const lines = [
      gps ? `Latitude: ${gps.lat}` : "Latitude: acquiring...",
      gps ? `Longitude: ${gps.lng}` : "Longitude: acquiring...",
      `Date: ${dateStr}`,
      `Time: ${timeStr}`,
      ...(addressLine ? [addressLine.slice(0, 48)] : []),
    ];
    const fs = Math.max(16, W * 0.025);
    const pad = Math.max(12, W * 0.015);
    const lh = fs * 1.7;
    const boxH = lines.length * lh + pad;
    const boxY = H - boxH - pad;
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, boxY - pad / 2, W * 0.78, boxH + pad);
    lines.forEach((line, i) => {
      ctx.font = `bold ${fs}px Arial`;
      ctx.fillStyle = "#ffffff";
      ctx.fillText(line, pad, boxY + lh * (i + 1));
    });
    const brandFs = Math.max(14, W * 0.02);
    ctx.font = `bold italic ${brandFs}px Arial`;
    ctx.fillStyle = "#f97316";
    const brand = "Powered by Prayga India Private Limited";
    ctx.fillText(brand, W - ctx.measureText(brand).width - pad, H - pad);
  };

  useEffect(() => {
    if (!ready || preview) return;
    const draw = () => {
      const video = videoRef.current;
      const overlay = overlayRef.current;
      if (!video || !overlay) { animFrameRef.current = requestAnimationFrame(draw); return; }
      overlay.width = video.videoWidth || video.clientWidth;
      overlay.height = video.videoHeight || video.clientHeight;
      const ctx = overlay.getContext("2d")!;
      ctx.clearRect(0, 0, overlay.width, overlay.height);
      drawOverlay(ctx, overlay.width, overlay.height);
      animFrameRef.current = requestAnimationFrame(draw);
    };
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [ready, gpsStatus, addressLine, preview]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const W = video.videoWidth;
    const H = video.videoHeight;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, W, H);
    drawOverlay(ctx, W, H);
    cancelAnimationFrame(animFrameRef.current);
    canvas.toBlob(blob => {
      if (blob) {
        setPreviewBlob(blob);
        setPreview(URL.createObjectURL(blob));
      }
    }, "image/jpeg", 0.92);
  };

  const retake = () => {
    setPreview(null);
    setPreviewBlob(null);
  };

  const save = async () => {
    if (!previewBlob) return;
    setSaving(true);
    streamRef.current?.getTracks().forEach(t => t.stop());
    onCapture(previewBlob, gpsRef.current);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {preview ? (
        // Preview screen
        <>
          <div className="relative flex-1 overflow-hidden">
            <img src={preview} className="w-full h-full object-contain" alt="Preview" />
            <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded">
              Preview — GPS stamped
            </div>
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white bg-black/40" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 p-6 bg-black">
            <button onClick={retake} className="flex flex-col items-center gap-1 text-white">
              <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <span className="text-xs">Retake</span>
            </button>
            <button onClick={save} disabled={saving} className="flex flex-col items-center gap-1 text-white">
              <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center disabled:opacity-50">
                {saving ? <Loader2 className="w-8 h-8 animate-spin" /> : <Check className="w-8 h-8" />}
              </div>
              <span className="text-xs">Save Photo</span>
            </button>
          </div>
        </>
      ) : (
        // Camera viewfinder
        <>
          <div className="relative flex-1 overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={overlayRef} className="absolute inset-0 w-full h-full pointer-events-none" />
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
            )}
            <div className={`absolute top-4 left-4 flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${gpsStatus === "got" ? "bg-green-500 text-white" : gpsStatus === "failed" ? "bg-red-500 text-white" : "bg-yellow-400 text-black"}`}>
              <Navigation className="w-3 h-3" />
              {gpsStatus === "got" ? "GPS Locked ✓" : gpsStatus === "failed" ? "GPS Failed" : "Getting GPS..."}
            </div>
            <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white bg-black/40" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center justify-center p-6 bg-black">
            <button onClick={capture} disabled={!ready}
              className="w-20 h-20 rounded-full bg-white border-4 border-gray-400 disabled:opacity-40 flex items-center justify-center active:scale-95 transition-transform">
              <Camera className="w-8 h-8 text-black" />
            </button>
          </div>
        </>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
