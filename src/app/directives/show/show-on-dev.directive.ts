import { CommonModule } from '@angular/common';
import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef, NgModule } from '@angular/core';
import { ShowBaseDirective } from '@directives/show/show-base.directive';
import { Environment } from '@services/app-layer/app-layer.environment';

type EnvType = 'PRODUCTION' | 'DEMO' | 'DEVELOPMENT';

@Directive({
  selector: '[appShowOnEnvs]'
})
export class ShowOnEnvsDirective extends ShowBaseDirective implements OnInit, OnDestroy {
  @Input('appShowOnEnvs') envs: EnvType[] = [];

  constructor(protected templateRef: TemplateRef<any>, protected viewContainerRef: ViewContainerRef) {
    super(templateRef, viewContainerRef);
  }

  ngOnInit() {
    if (this.envs.includes(Environment.environment)) {
      this.render();
    } else {
      this.clear();
    }
  }
}

@NgModule({
  imports: [CommonModule],
  exports: [ShowOnEnvsDirective],
  declarations: [ShowOnEnvsDirective],
  providers: []
})
export class ShowOnEnvsDirectiveModule {}
