import { CommonModule } from '@angular/common';
import { Directive, OnDestroy, OnInit, TemplateRef, ViewContainerRef, NgModule } from '@angular/core';
import { ShowBaseDirective } from '@directives/show/show-base.directive';
import { UserService } from '@services/app-layer/user/user.service';
import { takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[appShowViewCost]'
})
export class ShowViewCostDirective extends ShowBaseDirective implements OnInit, OnDestroy {
  constructor(
    protected templateRef: TemplateRef<any>,
    protected viewContainerRef: ViewContainerRef,
    private userService: UserService
  ) {
    super(templateRef, viewContainerRef);
  }

  ngOnInit() {
    this.userService
      .getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user.permissions.priceData) {
          this.render();
        } else {
          this.clear();
        }
      });
  }
}

@NgModule({
  imports: [CommonModule],
  exports: [ShowViewCostDirective],
  declarations: [ShowViewCostDirective],
  providers: []
})
export class ShowViewCostDirectiveModule {}
