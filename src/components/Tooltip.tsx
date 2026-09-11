import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: React.ReactNode;
  shortcut?: string;
  position?: 'top' | 'bottom';
  delay?: number;
  children: React.ReactElement;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  position = 'bottom',
  delay = 120,
  children,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const showTooltip = () => {
    timerRef.current = window.setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        if (position === 'bottom') {
          setCoords({
            top: rect.bottom + 6,
            left: rect.left + rect.width / 2,
          });
        } else {
          setCoords({
            top: rect.top - 6,
            left: rect.left + rect.width / 2,
          });
        }
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div
      ref={triggerRef}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
      className={`inline-flex ${className}`}
    >
      {children}
      {isVisible &&
        createPortal(
          <div
            style={{
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className={`fixed z-[9999] pointer-events-none -translate-x-1/2 ${
              position === 'bottom' ? 'animate-in fade-in slide-in-from-top-1' : '-translate-y-full animate-in fade-in slide-in-from-bottom-1'
            } duration-150 ease-out`}
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/95 text-zinc-100 text-[11px] font-medium shadow-2xl border border-white/10 backdrop-blur-md whitespace-nowrap">
              <span>{content}</span>
              {shortcut && (
                <kbd className="text-[10px] font-mono px-1 py-0.2 rounded bg-white/10 text-amber-300/90 border border-white/10">
                  {shortcut}
                </kbd>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
