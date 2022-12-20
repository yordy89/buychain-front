import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MainLayoutComponent } from '@app/layouts/main-layout/main-layout.component';
import { SpinnerHelperService } from '@services/helpers/spinner-helper/spinner-helper.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  isActive = false;
  isMainLayout = false;
  component: MainLayoutComponent;

  private destroy$ = new Subject<void>();

  constructor(private spinnerHelperService: SpinnerHelperService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this.spinnerHelperService
      .isActive()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isActive: boolean) => {
        setTimeout(() => (this.isActive = isActive));
      });
  }

  onActivate(component) {
    this.isMainLayout = component instanceof MainLayoutComponent;
    this.component = this.isMainLayout ? component : null;
    this.cd.detectChanges();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }
}
