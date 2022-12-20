import { CommonModule } from '@angular/common';
import { Directive, OnDestroy, OnInit, TemplateRef, ViewContainerRef, NgModule } from '@angular/core';
import { ShowBaseDirective } from '@directives/show/show-base.directive';
import { Environment } from '@services/app-layer/app-layer.environment';

@Directive({
  selector: '[appShowContract]'
})
export class ShowContractDirective extends ShowBaseDirective implements OnInit, OnDestroy {
  constructor(protected templateRef: TemplateRef<any>, protected viewContainerRef: ViewContainerRef) {
    super(templateRef, viewContainerRef);
  }

  ngOnInit() {
    if (Environment.isContractsSupported()) {
      this.render();
    } else {
      this.clear();
    }
  }
}

@NgModule({
  imports: [CommonModule],
  exports: [ShowContractDirective],
  declarations: [ShowContractDirective],
  providers: []
})
export class ShowContractDirectiveModule {}
