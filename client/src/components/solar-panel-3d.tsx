import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Minus, 
  RotateCw, 
  Maximize2, 
  Sun, 
  Zap,
  Home,
  Grid3X3,
  Move,
  Eye,
  RefreshCw
} from "lucide-react";

interface SolarPanel3DProps {
  onCapacityChange?: (capacity: number, panelCount: number) => void;
  initialCapacity?: number;
}

const PANEL_WIDTH = 1.1;
const PANEL_HEIGHT = 2.3;
const PANEL_DEPTH = 0.04;
const PANEL_WATTAGE = 545;
const PANEL_GAP = 0.15;

export function SolarPanel3D({ onCapacityChange, initialCapacity = 3 }: SolarPanel3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const roofRef = useRef<THREE.Mesh | null>(null);
  const houseRef = useRef<THREE.Group | null>(null);
  const panelMeshesRef = useRef<THREE.Mesh[]>([]);
  const animationRef = useRef<number>(0);
  const sunRef = useRef<THREE.DirectionalLight | null>(null);
  const panelMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const panelGeometryRef = useRef<THREE.BoxGeometry | null>(null);
  const isInitializedRef = useRef(false);
  
  const [roofWidth, setRoofWidth] = useState(12);
  const [roofLength, setRoofLength] = useState(10);
  const [roofAngle, setRoofAngle] = useState(15);
  const [panelCount, setPanelCount] = useState(Math.ceil((initialCapacity * 1000) / PANEL_WATTAGE));
  const [sunAngle, setSunAngle] = useState(45);
  const [viewMode, setViewMode] = useState<"3d" | "top">("3d");
  const [isAnimating, setIsAnimating] = useState(false);
  
  // String-based inputs for full editing control
  const [widthInput, setWidthInput] = useState("12");
  const [lengthInput, setLengthInput] = useState("10");
  const [panelCountInput, setPanelCountInput] = useState(String(Math.ceil((initialCapacity * 1000) / PANEL_WATTAGE)));
  
  const totalCapacity = (panelCount * PANEL_WATTAGE) / 1000;
  
  const maxPanelsPerRow = Math.floor(roofWidth / (PANEL_WIDTH + PANEL_GAP));
  const maxRows = Math.floor(roofLength / (PANEL_HEIGHT + PANEL_GAP));
  const maxPanels = Math.max(1, maxPanelsPerRow * maxRows);
  
  const effectivePanelCount = Math.min(panelCount, maxPanels);
  const panelFootprint = (PANEL_WIDTH + PANEL_GAP) * (PANEL_HEIGHT + PANEL_GAP);
  const actualAreaUsed = effectivePanelCount * panelFootprint;
  const roofArea = roofWidth * roofLength;
  const coveragePercent = Math.min(100, (actualAreaUsed / roofArea) * 100);

  const createPanelMaterial = useCallback(() => {
    if (panelMaterialRef.current) return panelMaterialRef.current;
    
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, "#1a365d");
    gradient.addColorStop(0.5, "#2563eb");
    gradient.addColorStop(1, "#1e40af");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 512);
    
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    
    const cellsX = 6;
    const cellsY = 12;
    const cellWidth = 256 / cellsX;
    const cellHeight = 512 / cellsY;
    
    for (let i = 0; i <= cellsX; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, 512);
      ctx.stroke();
    }
    for (let j = 0; j <= cellsY; j++) {
      ctx.beginPath();
      ctx.moveTo(0, j * cellHeight);
      ctx.lineTo(256, j * cellHeight);
      ctx.stroke();
    }
    
    ctx.fillStyle = "#c0c0c0";
    ctx.fillRect(0, 0, 256, 8);
    ctx.fillRect(0, 504, 256, 8);
    ctx.fillRect(0, 0, 8, 512);
    ctx.fillRect(248, 0, 8, 512);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      metalness: 0.3,
      roughness: 0.4,
    });
    
    panelMaterialRef.current = material;
    return material;
  }, []);

  const createRoofMaterial = useCallback(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    
    ctx.fillStyle = "#8B4513";
    ctx.fillRect(0, 0, 512, 512);
    
    ctx.fillStyle = "#A0522D";
    for (let y = 0; y < 512; y += 32) {
      for (let x = (y % 64 === 0 ? 0 : 32); x < 512; x += 64) {
        ctx.fillRect(x + 2, y + 2, 60, 28);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(roofWidth / 4, roofLength / 4);
    
    return new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.8,
    });
  }, [roofWidth, roofLength]);

  const cleanupPanels = useCallback(() => {
    if (!sceneRef.current) return;
    
    panelMeshesRef.current.forEach(mesh => {
      sceneRef.current!.remove(mesh);
      mesh.geometry.dispose();
    });
    panelMeshesRef.current = [];
  }, []);

  const cleanupHouse = useCallback(() => {
    if (!sceneRef.current || !houseRef.current) return;
    
    houseRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    });
    sceneRef.current.remove(houseRef.current);
    houseRef.current = null;
  }, []);

  const cleanupRoof = useCallback(() => {
    if (!sceneRef.current || !roofRef.current) return;
    
    sceneRef.current.remove(roofRef.current);
    roofRef.current.geometry.dispose();
    if (roofRef.current.material instanceof THREE.Material) {
      roofRef.current.material.dispose();
    }
    roofRef.current = null;
  }, []);

  const createHouse = useCallback(() => {
    if (!sceneRef.current) return;
    
    cleanupHouse();
    
    const houseGroup = new THREE.Group();
    
    const wallGeometry = new THREE.BoxGeometry(roofWidth * 0.8, 3, roofLength * 0.8);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5dc });
    const walls = new THREE.Mesh(wallGeometry, wallMaterial);
    walls.position.y = 1.5;
    walls.castShadow = true;
    walls.receiveShadow = true;
    houseGroup.add(walls);
    
    sceneRef.current.add(houseGroup);
    houseRef.current = houseGroup;
  }, [roofWidth, roofLength, cleanupHouse]);

  const updateRoof = useCallback(() => {
    if (!sceneRef.current) return;
    
    cleanupRoof();
    
    const roofGeometry = new THREE.BoxGeometry(roofWidth, 0.2, roofLength);
    const roofMaterial = createRoofMaterial();
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    
    roof.position.y = 3.5;
    roof.rotation.x = THREE.MathUtils.degToRad(-roofAngle);
    roof.castShadow = true;
    roof.receiveShadow = true;
    
    sceneRef.current.add(roof);
    roofRef.current = roof;
  }, [roofWidth, roofLength, roofAngle, createRoofMaterial, cleanupRoof]);

  const updatePanels = useCallback(() => {
    if (!sceneRef.current || !roofRef.current) return;
    
    cleanupPanels();
    
    if (!panelGeometryRef.current) {
      panelGeometryRef.current = new THREE.BoxGeometry(PANEL_WIDTH, PANEL_DEPTH, PANEL_HEIGHT);
    }
    
    const panelMaterial = createPanelMaterial();
    
    const startX = -(roofWidth / 2) + (PANEL_WIDTH / 2) + PANEL_GAP;
    const startZ = -(roofLength / 2) + (PANEL_HEIGHT / 2) + PANEL_GAP;
    
    let placedPanels = 0;
    const roofY = 3.5;
    const clampedPanelCount = Math.min(panelCount, maxPanels);
    
    for (let row = 0; row < maxRows && placedPanels < clampedPanelCount; row++) {
      for (let col = 0; col < maxPanelsPerRow && placedPanels < clampedPanelCount; col++) {
        const panel = new THREE.Mesh(panelGeometryRef.current, panelMaterial);
        
        const x = startX + col * (PANEL_WIDTH + PANEL_GAP);
        const z = startZ + row * (PANEL_HEIGHT + PANEL_GAP);
        
        const zOffset = Math.sin(THREE.MathUtils.degToRad(roofAngle)) * z;
        const y = roofY + 0.15 + zOffset;
        
        panel.position.set(x, y, z);
        panel.rotation.x = THREE.MathUtils.degToRad(-roofAngle);
        panel.castShadow = true;
        panel.receiveShadow = true;
        
        sceneRef.current!.add(panel);
        panelMeshesRef.current.push(panel);
        
        placedPanels++;
      }
    }
  }, [panelCount, roofWidth, roofLength, roofAngle, maxPanelsPerRow, maxRows, maxPanels, createPanelMaterial, cleanupPanels]);

  const updateSunPosition = useCallback(() => {
    if (!sunRef.current) return;
    
    const radius = 25;
    const angle = THREE.MathUtils.degToRad(sunAngle);
    sunRef.current.position.x = Math.cos(angle) * radius;
    sunRef.current.position.y = Math.sin(angle) * radius;
    sunRef.current.position.z = 10;
  }, [sunAngle]);

  const animateSun = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    let angle = 0;
    const animate = () => {
      if (angle >= 180) {
        setIsAnimating(false);
        setSunAngle(45);
        return;
      }
      angle += 2;
      setSunAngle(angle);
      requestAnimationFrame(animate);
    };
    animate();
  }, [isAnimating]);

  const setView = useCallback((mode: "3d" | "top") => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    setViewMode(mode);
    
    if (mode === "top") {
      cameraRef.current.position.set(0, 25, 0);
      controlsRef.current.target.set(0, 3.5, 0);
    } else {
      cameraRef.current.position.set(15, 15, 15);
      controlsRef.current.target.set(0, 3, 0);
    }
    controlsRef.current.update();
  }, []);

  const resetView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    cameraRef.current.position.set(15, 15, 15);
    controlsRef.current.target.set(0, 3, 0);
    controlsRef.current.update();
    setViewMode("3d");
  }, []);

  useEffect(() => {
    if (!containerRef.current || isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(15, 15, 15);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2;
    controls.minDistance = 5;
    controls.maxDistance = 50;
    controlsRef.current = controls;
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    scene.add(sunLight);
    sunRef.current = sunLight;
    
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x3d9140,
      roughness: 1 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.1;
    ground.receiveShadow = true;
    scene.add(ground);
    
    const gridHelper = new THREE.GridHelper(100, 100, 0x2d6a2f, 0x2d6a2f);
    gridHelper.position.y = 0;
    scene.add(gridHelper);
    
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();
    
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationRef.current);
      
      cleanupPanels();
      cleanupHouse();
      cleanupRoof();
      
      if (panelMaterialRef.current) {
        panelMaterialRef.current.dispose();
        panelMaterialRef.current = null;
      }
      if (panelGeometryRef.current) {
        panelGeometryRef.current.dispose();
        panelGeometryRef.current = null;
      }
      
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      isInitializedRef.current = false;
    };
  }, [cleanupPanels, cleanupHouse, cleanupRoof]);

  useEffect(() => {
    if (sceneRef.current) {
      createHouse();
      updateRoof();
    }
  }, [roofWidth, roofLength, roofAngle, createHouse, updateRoof]);

  useEffect(() => {
    if (sceneRef.current && roofRef.current) {
      updatePanels();
    }
  }, [panelCount, updatePanels]);

  useEffect(() => {
    updateSunPosition();
  }, [updateSunPosition]);

  useEffect(() => {
    if (onCapacityChange) {
      const clampedCount = Math.min(panelCount, maxPanels);
      const capacity = (clampedCount * PANEL_WATTAGE) / 1000;
      onCapacityChange(capacity, clampedCount);
    }
  }, [panelCount, maxPanels, onCapacityChange]);

  const addPanel = () => {
    if (panelCount < maxPanels) {
      const newCount = panelCount + 1;
      setPanelCount(newCount);
      setPanelCountInput(String(newCount));
    }
  };

  const removePanel = () => {
    if (panelCount > 1) {
      const newCount = panelCount - 1;
      setPanelCount(newCount);
      setPanelCountInput(String(newCount));
    }
  };

  // Handlers for string-based inputs
  const handleWidthChange = (value: string) => {
    setWidthInput(value);
  };

  const handleWidthBlur = () => {
    const num = parseFloat(widthInput);
    if (!isNaN(num) && num >= 3 && num <= 50) {
      setRoofWidth(num);
    } else {
      setWidthInput(String(roofWidth));
    }
  };

  const handleLengthChange = (value: string) => {
    setLengthInput(value);
  };

  const handleLengthBlur = () => {
    const num = parseFloat(lengthInput);
    if (!isNaN(num) && num >= 3 && num <= 50) {
      setRoofLength(num);
    } else {
      setLengthInput(String(roofLength));
    }
  };

  const handlePanelCountChange = (value: string) => {
    setPanelCountInput(value);
  };

  const handlePanelCountBlur = () => {
    const num = parseInt(panelCountInput, 10);
    if (!isNaN(num) && num >= 1) {
      const clamped = Math.min(num, maxPanels);
      setPanelCount(clamped);
      setPanelCountInput(String(clamped));
    } else {
      setPanelCountInput(String(panelCount));
    }
  };

  const actualCapacity = (effectivePanelCount * PANEL_WATTAGE) / 1000;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5 text-primary" />
            3D Solar Panel Placement
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Zap className="h-3 w-3" />
              {actualCapacity.toFixed(2)} kW
            </Badge>
            <Badge variant="outline" className="gap-1">
              {effectivePanelCount} Panels
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div 
          ref={containerRef} 
          className="w-full h-[400px] rounded-lg overflow-hidden border bg-muted"
          data-testid="container-3d-visualization"
        />
        
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setView("3d")}
            className={viewMode === "3d" ? "bg-primary/10" : ""}
            data-testid="button-view-3d"
          >
            <Eye className="h-4 w-4 mr-1" />
            3D View
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => setView("top")}
            className={viewMode === "top" ? "bg-primary/10" : ""}
            data-testid="button-view-top"
          >
            <Maximize2 className="h-4 w-4 mr-1" />
            Top View
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={resetView}
            data-testid="button-reset-view"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={animateSun}
            disabled={isAnimating}
            data-testid="button-animate-sun"
          >
            <Sun className="h-4 w-4 mr-1" />
            Sun Path
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Roof Dimensions (meters)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Width (3-50m)</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={widthInput}
                    onChange={(e) => handleWidthChange(e.target.value)}
                    onBlur={handleWidthBlur}
                    onKeyDown={(e) => e.key === "Enter" && handleWidthBlur()}
                    data-testid="input-roof-width"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Length (3-50m)</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={lengthInput}
                    onChange={(e) => handleLengthChange(e.target.value)}
                    onBlur={handleLengthBlur}
                    onKeyDown={(e) => e.key === "Enter" && handleLengthBlur()}
                    data-testid="input-roof-length"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <RotateCw className="h-4 w-4" />
                  Roof Angle
                </span>
                <span className="text-sm text-muted-foreground">{roofAngle} degrees</span>
              </Label>
              <Slider
                value={[roofAngle]}
                onValueChange={(value) => setRoofAngle(value[0])}
                min={0}
                max={45}
                step={5}
                data-testid="slider-roof-angle"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Number of Panels
                </span>
                <span className="text-sm text-muted-foreground">Max: {maxPanels}</span>
              </Label>
              <div className="flex items-center gap-2">
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={removePanel}
                  disabled={panelCount <= 1}
                  data-testid="button-remove-panel"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={panelCountInput}
                  onChange={(e) => handlePanelCountChange(e.target.value)}
                  onBlur={handlePanelCountBlur}
                  onKeyDown={(e) => e.key === "Enter" && handlePanelCountBlur()}
                  className="text-center"
                  data-testid="input-panel-count"
                />
                <Button 
                  size="icon" 
                  variant="outline" 
                  onClick={addPanel}
                  disabled={panelCount >= maxPanels}
                  data-testid="button-add-panel"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {panelCount > maxPanels && (
                <p className="text-xs text-orange-500">
                  Adjusted to {maxPanels} panels (max for current roof size)
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Sun Position
                </span>
                <span className="text-sm text-muted-foreground">{sunAngle} degrees</span>
              </Label>
              <Slider
                value={[sunAngle]}
                onValueChange={(value) => setSunAngle(value[0])}
                min={10}
                max={170}
                step={5}
                data-testid="slider-sun-position"
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-muted rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-primary">{actualCapacity.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">kW Capacity</div>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{effectivePanelCount}</div>
            <div className="text-xs text-muted-foreground">Panels ({PANEL_WATTAGE}W each)</div>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{actualAreaUsed.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">sq.m Used</div>
          </div>
          <div className="bg-muted rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{coveragePercent.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">Roof Coverage</div>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          <Move className="h-3 w-3 inline mr-1" />
          Drag to rotate view. Scroll to zoom. Use controls above to adjust parameters.
        </div>
      </CardContent>
    </Card>
  );
}
