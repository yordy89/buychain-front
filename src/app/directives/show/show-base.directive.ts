import { Directive, OnDestroy, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subject } from 'rxjs';

@Directive()
export abstract class ShowBaseDirective implements OnDestroy {
  private rendered = false;
  protected destroy$ = new Subject<void>();

  constructor(protected templateRef: TemplateRef<any>, protected viewContainerRef: ViewContainerRef) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  protected render() {
    if (this.rendered) {
      return;
    }

    this.viewContainerRef.createEmbeddedView(this.templateRef);
    this.rendered = true;
  }

  protected clear() {
    if (!this.rendered) {
      return;
    }

    this.viewContainerRef.clear();
    this.rendered = false;
  }
}
