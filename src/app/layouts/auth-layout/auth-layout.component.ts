import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Environment } from '@app/services/app-layer/app-layer.environment';
import { ViewportHelperService } from '@services/helpers/viewport-helper.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SkinService } from '@services/app-layer/skin/skin.service';

@Component({
  selector: 'app-auth-layout',
  templateUrl: './auth-layout.component.html',
  styleUrls: ['./auth-layout.component.scss']
})
export class AuthLayoutComponent implements OnInit, OnDestroy {
  public Environment = Environment;
  public isCustomDomain = Environment.isCustomDomain;

  public requestToRotate: boolean;
  public isSupportedResolution: boolean;

  private destroy$ = new Subject<void>();

  constructor(
    private skinService: SkinService,
    private renderer: Renderer2,
    private viewportHelperService: ViewportHelperService
  ) {}

  ngOnInit() {
    this.handleViewportChange();

    this.skinService.setSkinColors(this.skinService.getDefaultSkin());
    this.renderer.addClass(document.body, 'use-large-scroll-bars');

    if (this.isCustomDomain) {
      const companyColor = 'darkgreen';
      const container = document.querySelector('.auth-container') as HTMLElement;

      if (container) {
        container.style.cssText = `--main-color: ${companyColor} !important`;
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  private handleViewportChange() {
    this.viewportHelperService
      .observeRequestToRotateChange()
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.requestToRotate = value;
      });

    this.viewportHelperService
      .observeSupportedResolution()
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.isSupportedResolution = value;
      });
  }
}
