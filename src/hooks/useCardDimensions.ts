import { useState, useEffect } from 'react';
import type { MapOrientation } from '../types/map';

export function parseAspectRatio(ratioStr: string, orientation: MapOrientation): number {
  if (ratioStr) {
    const parts = ratioStr.split('/');
    if (parts.length === 2) {
      const w = parseFloat(parts[0]);
      const h = parseFloat(parts[1]);
      if (w > 0 && h > 0) return w / h;
    }
    const val = parseFloat(ratioStr);
    if (!isNaN(val) && val > 0) return val;
  }
  return orientation === 'horizontal' ? 4 / 3 : 3 / 4;
}

export function useCardDimensions(
  containerRef: React.RefObject<HTMLDivElement | null>,
  aspectRatio: string,
  orientation: MapOrientation,
  paddingFactor = 0.92
) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const ratio = parseAspectRatio(aspectRatio, orientation);
      const maxW = rect.width * paddingFactor;
      const maxH = rect.height * paddingFactor;

      let w = maxW;
      let h = w / ratio;

      if (h > maxH) {
        h = maxH;
        w = h * ratio;
      }

      setDimensions({
        width: Math.round(w),
        height: Math.round(h),
      });
    };

    update();

    const ro = new ResizeObserver(() => {
      update();
    });
    ro.observe(container);

    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [containerRef, aspectRatio, orientation, paddingFactor]);

  return dimensions;
}
