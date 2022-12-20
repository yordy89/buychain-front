import { ThemePalette } from '@angular/material/core';

export interface TableAction {
  label: string;
  value: number;
  icon?: string;
  labelClasses?: string[];
  color?: ((action: TableAction, options?: any) => ThemePalette) | ThemePalette;
  isDisabled?: ((action: TableAction, options?: any) => boolean) | boolean;
  isHidden?: ((action: TableAction, options?: any) => boolean) | boolean;
  prompt?: {
    title?: ((action: TableAction, options?: any) => string) | string;
    text: ((action: TableAction, options?: any) => string) | string;
  };
}
