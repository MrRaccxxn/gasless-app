"use client";

import { useState, useEffect } from "react";

const networks = ["Scroll", "Ethereum", "Base", "Optimism", "Polygon", "Stellar"];

export const AnimatedNetworkText = () => {
  const [currentNetworkIndex, setCurrentNetworkIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCurrentNetworkIndex((prev) => (prev + 1) % networks.length);
        setIsVisible(true);
      }, 300); // Half of transition duration
    }, 2500); // Change every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <span
      className={`inline-block font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent transition-all duration-500 transform ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 -translate-y-2 scale-95"
      }`}
    >
      {networks[currentNetworkIndex]}
    </span>
  );
}; 