import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { debounce, takeUntil } from 'rxjs/operators';
import { Subject, timer } from 'rxjs';
import { TypeCheck } from '@services/helpers/utils/type-check';

@Component({
  selector: 'app-number-input',
  templateUrl: './number-input.component.html',
  styleUrls: ['./number-input.component.scss']
})
export class NumberInputComponent implements OnInit, OnDestroy {
  @Input() control: FormControl;
  @Input() max: number = null;
  @Input() min: number = null;
  @Input() prefix: 'none' | 'dollar' = 'none';
  @Output() inputCompleted = new EventEmitter<void>();

  private parentValue = '';
  private valueChanged$ = new Subject<number>();
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.parentValue = this.control.value;

    this.valueChanged$
      .pipe(
        debounce((delay: number) => timer(delay)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.control.value !== this.parentValue) {
          this.inputCompleted.emit();
          this.parentValue = this.control.value;
        }
      });

    this.control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.emitWithDelay());
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  increase() {
    if (this.max !== null && this.control.value >= this.max) return;

    const current = parseFloat(this.control.value);
    const next = TypeCheck.isNumber(current) ? current + 1 : 0;

    this.control.setValue(next);
    this.control.markAsDirty();
  }

  decrease() {
    if (this.min !== null && this.control.value <= this.min) return;

    const current = parseFloat(this.control.value);
    const next = current - 1;

    this.control.setValue(next);
    this.control.markAsDirty();
  }

  onSubmit(event) {
    event.stopPropagation();
    this.emitImmediately();
  }

  private emitImmediately() {
    this.valueChanged$.next(0);
  }

  private emitWithDelay() {
    this.valueChanged$.next(1000);
  }
}
