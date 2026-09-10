import React from 'react';

interface Zoom100IconProps {
  className?: string;
  size?: number;
}

export const Zoom100Icon: React.FC<Zoom100IconProps> = ({ className = 'w-4 h-4', size }) => {
  const sizeProps = size ? { width: size, height: size } : {};
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...sizeProps}
    >
      <circle
        cx="10.5"
        cy="10.5"
        r="7.5"
        strokeWidth="1.9"
        stroke="currentColor"
      />
      <path
        d="M16 16L21.5 21.5"
        strokeWidth="2.4"
        strokeLinecap="round"
        stroke="currentColor"
      />
      <text
        x="10.5"
        y="11.2"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="6.8"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fill="currentColor"
        stroke="none"
        letterSpacing="-0.6px"
      >
        100
      </text>
    </svg>
  );
};
