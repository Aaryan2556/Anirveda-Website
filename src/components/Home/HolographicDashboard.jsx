import React, { useState, lazy, Suspense } from "react";
import GlobeHUDOverlay from "./GlobeHUDOverlay";

// Dynamically code-split heavy Three.js WebGL canvas bundle with React.lazy
const GeoEarthGlobe = lazy(() => import("./GeoEarthGlobe"));

/**
 * HolographicDashboard Component
 * Composes HUD telemetry overlay and lazy-loaded 3D WebGL Globe canvas.
 */
export default function HolographicDashboard() {
  const [activeHub, setActiveHub] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [currentMode, setCurrentMode] = useState("HYBRID");

  const handleToggleAutoRotate = () => {
    setAutoRotate((prev) => !prev);
  };

  const handleResetCamera = () => {
    setActiveHub(null);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto my-8 sm:mt-28 sm:mb-20 lg:mt-32 rounded-3xl bg-card border border-border p-2 sm:p-6 backdrop-blur-xl shadow-2xl overflow-hidden isolation-auto select-none">
      

      {/* Main HUD Command Center Container */}
      <div className="relative w-full h-[480px] sm:h-[620px] rounded-2xl bg-background overflow-hidden flex items-center justify-center border border-border/80">
        {/* Fixed-Size Centered Globe Wrapper */}
        <div className="w-[280px] h-[300px] sm:w-[500px] sm:h-[500px] pointer-events-auto z-10 relative flex items-center justify-center">
          <Suspense
            fallback={
              <div className="w-full h-full bg-background rounded-full border border-primary/20 animate-pulse flex items-center justify-center font-mono text-xs text-primary/70">
                <span>INITIALIZING SPATIAL MATRIX...</span>
              </div>
            }
          >
            <GeoEarthGlobe
              activeHub={activeHub}
              onSelectHub={setActiveHub}
              autoRotate={autoRotate}
              currentMode={currentMode}
            />
          </Suspense>
        </div>

        {/* HUD Telemetry Overlay */}
        <GlobeHUDOverlay
          activeHub={activeHub}
          onResetCamera={handleResetCamera}
          currentMode={currentMode}
          onModeChange={setCurrentMode}
          autoRotate={autoRotate}
          onToggleAutoRotate={handleToggleAutoRotate}
        />
      </div>
    </div>
  );
}