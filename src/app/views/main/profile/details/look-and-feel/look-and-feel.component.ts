import { Component, OnInit } from '@angular/core';
import { Skin } from '@services/app-layer/entities/skin';
import { SkinService } from '@services/app-layer/skin/skin.service';

@Component({
  selector: 'app-look-and-feel',
  templateUrl: './look-and-feel.component.html',
  styleUrls: ['./look-and-feel.component.scss']
})
export class LookAndFeelComponent implements OnInit {
  public profiles: Skin[] = [];
  public selectedProfile: Skin;
  public customProfile: Skin;

  constructor(private skinService: SkinService) {}

  ngOnInit() {
    this.profiles = this.skinService.getSkins();
    const current = this.skinService.getCurrentSkin();
    if (current.isCustom) {
      this.selectedProfile = current;
    } else {
      this.selectedProfile = this.profiles.find(x => x.name === current.name);
    }
    this.customProfile = this.prepareCustomSkin(this.selectedProfile);
  }

  onValueChange(event, optionName) {
    this.selectedProfile = this.customProfile;
    if (optionName) this.selectedProfile[optionName] = event.color.hex;
    this.skinService.setCurrentSkin(this.selectedProfile);
  }

  onDarkModeChange(event) {
    this.selectedProfile = this.customProfile;
    this.selectedProfile.isDark = event.checked;
    this.skinService.setCurrentSkin(this.selectedProfile);
  }

  onUseLargeScrollBarsChange(event) {
    this.selectedProfile = this.customProfile;
    this.selectedProfile.useLargeScrollBars = event.checked;
    this.skinService.setCurrentSkin(this.selectedProfile);
  }

  onProfileChange(event) {
    const selected = event.value;
    this.selectedProfile = selected;
    this.skinService.setCurrentSkin(this.selectedProfile);
    this.customProfile = this.prepareCustomSkin(this.selectedProfile);
  }

  prepareCustomSkin(basedOnSkin: Skin): Skin {
    const skin = new Skin('Custom');
    skin.isCustom = true;
    skin.isDark = basedOnSkin.isDark;
    skin.primaryColor = basedOnSkin.primaryColor;
    skin.accentColor = basedOnSkin.accentColor;
    skin.warnColor = basedOnSkin.warnColor;
    skin.useLargeScrollBars = basedOnSkin.useLargeScrollBars;
    return skin;
  }
}
