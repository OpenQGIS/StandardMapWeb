declare module 'morphicons' {
  export type IconNodeAttrs = Record<string, string | number | undefined>;
  export type IconNode = ReadonlyArray<readonly [string, IconNodeAttrs]>;
  export type IconInput = IconNode | string;

  export type SpringPreset = 'snappy' | 'bouncy' | 'gentle' | 'stiff';

  export interface MorphOptions {
    stiffness?: number;
    damping?: number;
  }

  export type ReducedMotionMode = 'never' | 'user' | 'always';

  export interface Morph {
    morphTo(icon: IconInput, spring?: SpringPreset | MorphOptions): void;
    set(icon: IconInput): void;
    seek(icon: IconInput, t: number): void;
    progress: number;
    reducedMotion: ReducedMotionMode;
    destroy(): void;
  }
}

declare module 'morphicons/react' {
  import React, { SVGProps } from 'react';
  import type { IconInput, SpringPreset, MorphOptions, ReducedMotionMode } from 'morphicons';

  export interface MorphHandle {
    morphTo(icon: IconInput, spring?: SpringPreset | MorphOptions): void;
    set(icon: IconInput): void;
  }

  export interface MorphIconProps extends Omit<SVGProps<SVGSVGElement>, 'from' | 'to' | 'ref'> {
    icon?: IconInput;
    from?: IconInput;
    to?: IconInput;
    progress?: number;
    spring?: SpringPreset | MorphOptions;
    reducedMotion?: ReducedMotionMode;
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    absoluteStrokeWidth?: boolean;
    label?: string;
    className?: string;
  }

  export const MorphIcon: React.ForwardRefExoticComponent<
    MorphIconProps & React.RefAttributes<MorphHandle>
  >;
}

declare module 'lucide-react/dist/esm/icons/*.mjs' {
  export const __iconData: {
    name: string;
    size: number;
    node: readonly [string, Record<string, string | number | undefined>][];
  };
}
