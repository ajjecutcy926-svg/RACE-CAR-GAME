import { useState, useEffect } from 'react';

export interface HUDScaleMetrics {
  width: number;
  height: number;
  aspectRatio: number;
  dpr: number;
  screenClass: 'mobile-portrait' | 'mobile-landscape' | 'tablet' | 'desktop' | 'ultrawide' | '4k';
  hudScale: number;          // Overall HUD scale factor (0.75 to 1.35)
  speedometerScale: number;  // Calibrated scale for circular speedometer gauge (0.70 to 1.30)
  radarScale: number;        // Calibrated scale for rear proximity radar visor (0.75 to 1.25)
  topBarScale: number;       // Calibrated scale for top telemetry & action icons (0.78 to 1.20)
  isCompact: boolean;        // True when viewport is constrained
  isPortrait: boolean;       // True when height > width
  isShortScreen: boolean;    // True when height < 520px (e.g., mobile landscape)
  isTouchScreen: boolean;    // True when primary pointer is touch or coarse
}

/**
 * Calculates adaptive scaling metrics based on screen resolution, physical dimension, and aspect ratio.
 */
function computeScaleMetrics(): HUDScaleMetrics {
  if (typeof window === 'undefined') {
    return {
      width: 1920,
      height: 1080,
      aspectRatio: 16 / 9,
      dpr: 1,
      screenClass: 'desktop',
      hudScale: 1.0,
      speedometerScale: 1.0,
      radarScale: 1.0,
      topBarScale: 1.0,
      isCompact: false,
      isPortrait: false,
      isShortScreen: false,
      isTouchScreen: false,
    };
  }

  const width = Math.max(320, window.innerWidth);
  const height = Math.max(320, window.innerHeight);
  const aspectRatio = width / height;
  const dpr = window.devicePixelRatio || 1;
  const isTouchScreen =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches;

  const isPortrait = aspectRatio < 1.0;
  const isShortScreen = height < 520;

  // Classify screen profile
  let screenClass: HUDScaleMetrics['screenClass'] = 'desktop';
  if (isPortrait && width < 640) {
    screenClass = 'mobile-portrait';
  } else if (!isPortrait && (height < 520 || width < 840)) {
    screenClass = 'mobile-landscape';
  } else if (width <= 1100 && height <= 1366) {
    screenClass = 'tablet';
  } else if (aspectRatio > 2.1) {
    screenClass = 'ultrawide';
  } else if (width >= 2560 || height >= 1440) {
    screenClass = '4k';
  } else {
    screenClass = 'desktop';
  }

  const isCompact = screenClass === 'mobile-portrait' || screenClass === 'mobile-landscape' || width < 768;

  // Compute adaptive base scale factor against standard 1080p landscape baseline (1920 x 1080)
  let baseScale = 1.0;
  let speedometerScale = 1.0;
  let radarScale = 1.0;
  let topBarScale = 1.0;

  switch (screenClass) {
    case 'mobile-portrait': {
      // Narrow width is primary constraint
      const widthRatio = width / 400;
      baseScale = Math.min(1.0, Math.max(0.74, 0.76 + (widthRatio - 1) * 0.15));
      speedometerScale = Math.min(0.88, Math.max(0.70, width / 460));
      radarScale = Math.min(0.86, Math.max(0.74, width / 480));
      topBarScale = Math.min(0.85, Math.max(0.74, width / 440));
      break;
    }
    case 'mobile-landscape': {
      // Short vertical height is primary constraint
      const heightRatio = height / 420;
      baseScale = Math.min(0.92, Math.max(0.70, 0.72 + (heightRatio - 1) * 0.20));
      speedometerScale = Math.min(0.86, Math.max(0.68, height / 480));
      radarScale = Math.min(0.84, Math.max(0.72, height / 500));
      topBarScale = Math.min(0.86, Math.max(0.72, height / 460));
      break;
    }
    case 'tablet': {
      // Tablets have good room, moderate scaling
      const minDimension = Math.min(width, height);
      baseScale = Math.min(1.05, Math.max(0.88, minDimension / 800));
      speedometerScale = Math.min(1.0, Math.max(0.86, baseScale));
      radarScale = Math.min(1.0, Math.max(0.88, baseScale));
      topBarScale = Math.min(1.0, Math.max(0.88, baseScale));
      break;
    }
    case 'ultrawide': {
      // Anchor scaling to height rather than extreme horizontal width
      const heightRatio = height / 1080;
      baseScale = Math.min(1.25, Math.max(1.0, 1.0 + (heightRatio - 1) * 0.35));
      speedometerScale = Math.min(1.20, Math.max(1.0, baseScale));
      radarScale = Math.min(1.15, Math.max(1.0, baseScale));
      topBarScale = Math.min(1.10, Math.max(1.0, baseScale));
      break;
    }
    case '4k': {
      // High-resolution displays scale up for enhanced legibility
      const dimRatio = Math.min(width / 1920, height / 1080);
      baseScale = Math.min(1.35, Math.max(1.10, 1.0 + (dimRatio - 1) * 0.32));
      speedometerScale = Math.min(1.30, Math.max(1.12, baseScale));
      radarScale = Math.min(1.25, Math.max(1.08, baseScale));
      topBarScale = Math.min(1.20, Math.max(1.05, baseScale));
      break;
    }
    case 'desktop':
    default: {
      const wRatio = width / 1440;
      const hRatio = height / 900;
      const fit = Math.min(wRatio, hRatio);
      baseScale = Math.min(1.10, Math.max(0.92, 0.95 + (fit - 1) * 0.2));
      speedometerScale = Math.min(1.08, Math.max(0.92, baseScale));
      radarScale = Math.min(1.05, Math.max(0.94, baseScale));
      topBarScale = Math.min(1.05, Math.max(0.94, baseScale));
      break;
    }
  }

  return {
    width,
    height,
    aspectRatio,
    dpr,
    screenClass,
    hudScale: Number(baseScale.toFixed(3)),
    speedometerScale: Number(speedometerScale.toFixed(3)),
    radarScale: Number(radarScale.toFixed(3)),
    topBarScale: Number(topBarScale.toFixed(3)),
    isCompact,
    isPortrait,
    isShortScreen,
    isTouchScreen,
  };
}

/**
 * Hook providing dynamic viewport and HUD scale metrics that update on window resize or orientation changes.
 */
export function useHUDScale(): HUDScaleMetrics {
  const [metrics, setMetrics] = useState<HUDScaleMetrics>(computeScaleMetrics);

  useEffect(() => {
    let rAFId: number | null = null;

    const handleResize = () => {
      if (rAFId) cancelAnimationFrame(rAFId);
      rAFId = requestAnimationFrame(() => {
        setMetrics(computeScaleMetrics());
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    return () => {
      if (rAFId) cancelAnimationFrame(rAFId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return metrics;
}
