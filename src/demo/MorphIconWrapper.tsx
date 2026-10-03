import React from 'react';
import { MorphIcon } from 'morphicons/react';
import type { IconInput, SpringPreset, MorphOptions } from 'morphicons';

export interface MorphIconWrapperProps {
  icon?: IconInput;
  from?: IconInput;
  to?: IconInput;
  progress?: number;
  springPreset?: SpringPreset;
  spring?: SpringPreset | MorphOptions;
  size?: number | string;
  strokeWidth?: number | string;
  color?: string;
  className?: string;
  interactive?: boolean;
}

/**
 * MorphIconWrapper: 统一接入本地 morphicons 资源的 React 图标容器组件
 * 具备自动物理形变、平滑过渡与微交互响应
 */
export const MorphIconWrapper: React.FC<MorphIconWrapperProps> = ({
  icon,
  from,
  to,
  progress,
  springPreset = 'snappy',
  spring,
  size = 18,
  strokeWidth = 2,
  color = 'currentColor',
  className = '',
  interactive = true,
}) => {
  return (
    <span
      className={`inline-flex items-center justify-center transition-transform ${
        interactive ? 'active:scale-90 group-active:scale-90 duration-150' : ''
      } ${className}`}
    >
      <MorphIcon
        icon={icon}
        from={from}
        to={to}
        progress={progress}
        spring={spring ?? springPreset}
        size={size}
        strokeWidth={strokeWidth}
        color={color}
      />
    </span>
  );
};
