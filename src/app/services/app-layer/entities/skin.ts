export class Skin {
  public name: string;
  public isCustom: boolean;
  public isDark: boolean;
  public primaryColor: string;
  public accentColor: string;
  public warnColor: string;
  public useLargeScrollBars: boolean;

  constructor(name: string) {
    this.name = name;
  }
}
