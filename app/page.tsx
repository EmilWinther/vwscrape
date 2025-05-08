'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import '@arcgis/core/assets/esri/themes/light/main.css';

// Dynamically import ArcGIS components with no SSR
const MapComponent = dynamic(() => import('../components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="text-xl">Loading map...</div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="h-screen w-screen">
      <MapComponent />
    </main>
  );
} 