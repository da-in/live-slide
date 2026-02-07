"use client";

import { useState, useEffect } from "react";
import SttSocketPanel from "@/components/SttSocketPanel";

export default function PresentationPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsVisible(true));
    });
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className="min-h-screen bg-gray-900 transition-opacity duration-[600ms] ease-out"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <SttSocketPanel />
    </div>
  );
}
