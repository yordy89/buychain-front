import { ThemePalette } from '@angular/material/core';

export interface FABAction {
  label: string;
  value: number;
  icon?: string;
  color?: ((action: FABAction, options?: any) => ThemePalette) | ThemePalette;
  isHidden?: ((action: FABAction, options?: any) => boolean) | boolean;
  prompt?: {
    title?: ((action: FABAction, options?: any) => string) | string;
    text: ((action: FABAction, options?: any) => string) | string;
  };
}
