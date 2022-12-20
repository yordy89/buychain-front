import { Injectable, EventEmitter } from '@angular/core';
import { Skin } from '../entities/skin';
import { Environment } from '../app-layer.environment';
import { UserService } from '@services/app-layer/user/user.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { MaterialCssVariables, MaterialCssVarsService } from 'angular-material-css-vars';
import DxThemes from 'devextreme/ui/themes';

@Injectable({ providedIn: 'root' })
export class SkinService {
  public skinChange = new EventEmitter<Skin>();

  constructor(private materialCssVarsService: MaterialCssVarsService, private userService: UserService) {}

  getCurrentSkin(): Skin {
    const userPreferences = Environment.getCurrentUser()?.normalizedPreferences || null;
    if (!userPreferences || !userPreferences.lookAndFeel || !userPreferences.lookAndFeel.uiSkin)
      return this.getDefaultSkin();
    return ObjectUtil.getDeepCopy(userPreferences.lookAndFeel.uiSkin);
  }

  getSkins(): Skin[] {
    return [this.getDefaultSkin(), this.getBuyChainDarkSkin(), this.getGreenForestSkin()];
  }

  setSkinColors(skin: Skin): void {
    if (skin.isDark) {
      this.materialCssVarsService.setDarkTheme(true);
      this.materialCssVarsService.setVariable(MaterialCssVariables.BackgroundDialog, '66, 66, 66');
    } else {
      this.materialCssVarsService.setDarkTheme(false);
      this.materialCssVarsService.setVariable(MaterialCssVariables.BackgroundDialog, '255, 255, 255');
    }

    if (skin.primaryColor) {
      this.materialCssVarsService.setPrimaryColor(skin.primaryColor);
    }

    if (skin.accentColor) {
      this.materialCssVarsService.setAccentColor(skin.accentColor);
    }

    if (skin.warnColor) {
      this.materialCssVarsService.setWarnColor(skin.warnColor);
    }

    this.setDxTheme(skin.isDark);
  }

  setDxTheme(isSkinDark: boolean) {
    const isCurrentDark = this.isCurrentDark;

    if ((isCurrentDark && isSkinDark) || (!isCurrentDark && !isSkinDark)) {
      return;
    }

    const targetTheme = isCurrentDark ? 'generic.light' : 'generic.dark';
    DxThemes.current(targetTheme);
  }

  get isCurrentDark() {
    return DxThemes.current() === 'generic.dark';
  }

  setCurrentSkin(skin: Skin) {
    Environment.skin = skin;
    this.userService.updateUserPreferences('lookAndFeel-uiSkin', skin).subscribe();
    this.skinChange.emit(skin);
  }

  getDefaultSkin(): Skin {
    const skin = new Skin('BuyChain Default');
    skin.isDark = false;
    skin.primaryColor = '#2f5c9d';
    skin.accentColor = '#ffc107';
    skin.warnColor = '#f44336';
    skin.useLargeScrollBars = true;

    return skin;
  }

  getGreenForestSkin(): Skin {
    const skin = new Skin('Green Forest Profile');
    skin.isDark = false;
    skin.primaryColor = '#388e3c';
    skin.accentColor = '#cddc39';
    skin.warnColor = '#ff8a65';
    skin.useLargeScrollBars = true;

    return skin;
  }

  getBuyChainDarkSkin(): Skin {
    const skin = new Skin('Buy Chain Dark Profile');
    skin.isDark = true;
    skin.primaryColor = '#bbdefb';
    skin.accentColor = '#ffeb3b';
    skin.warnColor = '#d32f2f';
    skin.useLargeScrollBars = true;

    return skin;
  }
}
