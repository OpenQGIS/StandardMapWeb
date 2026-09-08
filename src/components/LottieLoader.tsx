import React, { useEffect, useRef } from 'react';
import lottie from 'lottie-web/build/player/lottie_light';
import type { AnimationItem } from 'lottie-web';
import loadingAnimationData from '../assets/loading.json';

interface LottieLoaderProps {
  className?: string;
  size?: number;
  text?: string;
}

export const LottieLoader: React.FC<LottieLoaderProps> = ({
  className = '',
  size = 52,
  text = '载入高精度地图中...',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: loadingAnimationData,
    });
    animRef.current = anim;

    return () => {
      anim.destroy();
    };
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center gap-2 select-none pointer-events-none ${className}`}>
      <div
        ref={containerRef}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="flex items-center justify-center overflow-hidden"
      />
      {text && (
        <span className="text-[11px] text-zinc-300 font-medium tracking-wide">
          {text}
        </span>
      )}
    </div>
  );
};
