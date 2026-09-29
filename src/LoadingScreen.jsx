import React, { useState, useEffect, useCallback } from "react";
import { BlurText } from "./components/common/BlurText";
import FloatingShapes from "./components/common/FloatingShapes";

/**
 * GeometricMatrixLoader Component for central loading core animation.
 */
const GeometricMatrixLoader = () => {
  const amberColor = "rgb(201, 135, 43)";
  const darkAmberShadow = "rgba(201, 135, 43, 0.7)";

  return (
    <div className="loading-container relative mt-8">
      {/* Central Hexagon */}
      <div
        className="central-hexagon"
        style={{
          borderColor: amberColor,
          boxShadow: `0 0 20px ${darkAmberShadow}`,
        }}
      />

      {/* Inner Dot */}
      <div
        className="inner-dot-v2"
        style={{
          backgroundColor: amberColor,
          boxShadow: `0 0 10px ${amberColor}, 0 0 20px ${darkAmberShadow}`,
        }}
      />

      {/* Cascading Data Lines */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="data-cascade"
          style={{
            backgroundColor: amberColor,
            boxShadow: `0 0 8px ${amberColor}`,
            animationDelay: `${i * 0.5}s`,
          }}
        />
      ))}

      {/* Outer Layer Connecting Nodes */}
      {[...Array(5)].map((_, i) => {
        const positions = [
          { top: "10%", left: "20%" },
          { top: "80%", left: "70%" },
          { top: "30%", left: "80%" },
          { top: "60%", left: "10%" },
          { top: "5%", left: "50%" },
        ];
        return (
          <div
            key={i}
            className="connecting-node"
            style={{
              backgroundColor: "rgba(201, 135, 43, 0.4)",
              ...positions[i],
              animationDelay: `${i * 0.5}s`,
            }}
          />
        );
      })}
    </div>
  );
};

/**
 * Modularized LoadingScreen Component.
 * Composes floating particle matrix, animated spring BlurText titles, and GeometricMatrixLoader core.
 */
export default function LoadingScreen() {
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [contentReady, setContentReady] = useState(false);
  const [animationDone, setAnimationDone] = useState(false);
  const transitionOutDuration = 1000;

  const technoEconomicTerms = [
    "BLOCKCHAIN",
    "BITCOIN",
    "ETHEREUM",
    "AI",
    "ML",
    "DEFI",
    "NFT",
    "SMART CONTRACT",
    "LIQUIDITY",
    "GDP",
    "INFLATION",
    "REPO RATE",
    "FIAT",
    "FINTECH",
    "QUANTUM",
    "ALGORITHM",
    "CYBER",
    "METAVERSE",
    "WEB3",
    "SUPPLY CHAIN",
    "LOGISTICS",
    "MARKET CAP",
    "VOLATILITY",
  ];

  useEffect(() => {
    const contentDelay = 5000;
    const timer = setTimeout(() => {
      setContentReady(true);
      setAnimationDone(true);
    }, contentDelay);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (contentReady && animationDone) {
      const timer = setTimeout(() => {
        setShowLoadingScreen(false);
      }, transitionOutDuration);
      return () => clearTimeout(timer);
    }
  }, [contentReady, animationDone, transitionOutDuration]);

  if (!showLoadingScreen) return null;

  return (
    <>
      <style>
        {`
          .loading-container {
            width: 150px;
            height: 150px;
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
            transform-style: preserve-3d;
          }

          .central-hexagon {
            position: absolute;
            width: 70px;
            height: 70px;
            background-color: transparent;
            clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
            animation: hexagon-pulse 2s ease-in-out infinite alternate, rotate-slow 15s linear infinite;
          }

          @keyframes hexagon-pulse {
            0% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 15px rgba(201, 135, 43, 0.7); }
            50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 30px rgba(201, 135, 43, 1); }
            100% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 15px rgba(201, 135, 43, 0.7); }
          }

          @keyframes rotate-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          .inner-dot-v2 {
            position: absolute;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            animation: pulse-dot 1.5s ease-in-out infinite alternate;
          }

          @keyframes pulse-dot {
            0% { transform: scale(0.7); opacity: 0.7; }
            50% { transform: scale(1.1); opacity: 1; }
            100% { transform: scale(0.7); opacity: 0.7; }
          }

          .data-cascade {
            position: absolute;
            width: 3px;
            height: 3px;
            opacity: 0;
            animation: cascade-flow 3s linear infinite;
            transform-origin: center center;
            border-radius: 1px;
          }

          @keyframes cascade-flow {
            0% { opacity: 0; transform: translate(0, 0); }
            10% { opacity: 1; }
            25% { transform: translate(40px, 0); }
            50% { transform: translate(40px, 40px); }
            75% { transform: translate(0, 40px); }
            90% { opacity: 1; }
            100% { opacity: 0; transform: translate(0, 0); }
          }

          .connecting-node {
            position: absolute;
            width: 5px;
            height: 5px;
            border-radius: 50%;
            opacity: 0;
            animation: node-connect 4s ease-in-out infinite;
          }

          @keyframes node-connect {
            0% { opacity: 0; transform: scale(0.5); }
            25% { opacity: 1; transform: scale(1); }
            75% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.5); }
          }

          @media (max-width: 768px) {
            .loading-container { width: 120px; height: 120px; }
            .central-hexagon { width: 50px; height: 50px; }
            .inner-dot-v2 { width: 6px; height: 6px; }
            .data-cascade { width: 2.5px; height: 2.5px; }
          }

          @media (max-width: 640px) {
            .loading-container { width: 100px; height: 100px; }
            .central-hexagon { width: 40px; height: 40px; }
            .inner-dot-v2 { width: 5px; height: 5px; }
            .data-cascade { width: 2px; height: 2px; }
          }
        `}
      </style>

      <div className="fixed inset-0 z-50 bg-black overflow-hidden flex justify-center items-center">
        {/* Particle Term Matrix Canvas */}
        <FloatingShapes termsArray={technoEconomicTerms} />

        {/* Central Brand & Loader */}
        <div className="relative z-10 flex flex-col items-center">
          <BlurText
            text="ANIRVEDA"
            delay={70}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-amber-500 font-bold"
          />
          <BlurText
            text="The Techno-Economics club"
            delay={100}
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-amber-500 mt-4"
          />
          <GeometricMatrixLoader />
        </div>

        <div role="status" aria-live="polite" className="sr-only">
          Loading. Please wait.
        </div>
      </div>
    </>
  );
}
