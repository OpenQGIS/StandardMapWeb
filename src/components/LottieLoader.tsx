import React, { useEffect, useRef, useMemo } from 'react';
import lottie from 'lottie-web/build/player/lottie_light';
import type { AnimationItem } from 'lottie-web';
import loadingAnimationData from '../assets/loading.json';

export type LottieColorTheme = 'default' | 'emerald' | 'amber';

interface LottieLoaderProps {
  className?: string;
  size?: number;
  text?: string;
  colorTheme?: LottieColorTheme;
}

// Deep clone and replace color values in Lottie JSON
function createThemedAnimationData(theme: LottieColorTheme) {
  if (theme === 'default') {
    return loadingAnimationData;
  }

  const targetColor =
    theme === 'emerald'
      ? [0.20392, 0.82745, 0.6, 1] // #34d399 (emerald-400)
      : [0.98431, 0.74902, 0.14118, 1]; // #fbbf24 (amber-400)

  const cloned = JSON.parse(JSON.stringify(loadingAnimationData));
  if (Array.isArray(cloned.layers)) {
    for (const layer of cloned.layers) {
      if (Array.isArray(layer.shapes)) {
        for (const shape of layer.shapes) {
          if (Array.isArray(shape.it)) {
            for (const item of shape.it) {
              if (item.c && Array.isArray(item.c.k)) {
                item.c.k = [...targetColor];
              }
            }
          }
        }
      }
    }
  }
  return cloned;
}

// Cache themed datasets to ensure zero redundant cloning
const THEME_DATA_CACHE: Record<LottieColorTheme, unknown> = {
  default: loadingAnimationData,
  emerald: createThemedAnimationData('emerald'),
  amber: createThemedAnimationData('amber'),
};

export const LottieLoader: React.FC<LottieLoaderProps> = ({
  className = '',
  size = 52,
  text,
  colorTheme = 'default',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  const animationData = useMemo(() => {
    return THEME_DATA_CACHE[colorTheme] || THEME_DATA_CACHE.default;
  }, [colorTheme]);

  useEffect(() => {
    if (!containerRef.current) return;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData,
    });
    animRef.current = anim;

    return () => {
      anim.destroy();
    };
  }, [animationData]);

  const glowClass =
    colorTheme === 'emerald'
      ? 'drop-shadow-[0_0_5px_rgba(52,211,153,0.7)]'
      : colorTheme === 'amber'
      ? 'drop-shadow-[0_0_5px_rgba(251,191,36,0.7)]'
      : '';

  return (
    <div className={`flex flex-col items-center justify-center select-none pointer-events-none ${className}`}>
      <div
        ref={containerRef}
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`flex items-center justify-center shrink-0 overflow-hidden ${glowClass}`}
      />
      {text && (
        <span className="text-[11px] text-zinc-300 font-medium tracking-wide mt-2">
          {text}
        </span>
      )}
    </div>
  );
};
