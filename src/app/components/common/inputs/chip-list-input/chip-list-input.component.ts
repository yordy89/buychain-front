import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatChipList } from '@angular/material/chips';
import { MatFormFieldAppearance } from '@angular/material/form-field';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { Subject } from 'rxjs';
import { map, startWith, takeUntil, withLatestFrom } from 'rxjs/operators';

@Component({
  selector: 'app-chip-list-input',
  templateUrl: './chip-list-input.component.html',
  styleUrls: ['./chip-list-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ChipListInputComponent),
      multi: true
    }
  ]
})
export class ChipListInputComponent implements OnInit, OnDestroy, ControlValueAccessor, AfterContentInit, OnChanges {
  @Input() placeholder: string;
  @Input() label: string;
  @Input() data: any[] = [];
  @Input() keyName: string;
  @Input() displayName: string;
  @Input() isDisabled = false;
  @Input() appearance: MatFormFieldAppearance = 'outline';
  @Input() fullWidth = true;
  @Input() panelWidth = null;

  @ViewChild('autocomplete') autocompleteTrigger: MatAutocompleteTrigger;
  @ViewChild('inputElem') inputElem: ElementRef<HTMLInputElement>;
  @ViewChild(MatChipList) chipList: MatChipList;

  addedOptions: Set<string> = new Set<string>();
  formControl: FormControl = new FormControl();
  filteredOptions: any[] = [];

  private searchControl: FormControl = new FormControl();
  private options: any[] = [];
  private destroy$ = new Subject<void>();
  private onChange: (value) => void;
  private onTouch: () => void;

  constructor(
    private injector: Injector,
    private notificationHelperService: NotificationHelperService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.setDefaults();
    this.setData(this.data);

    if (!this.displayName && this.keyName) {
      this.displayName = this.keyName;
    }

    this.searchControl.valueChanges
      .pipe(
        startWith(''),
        map(value => (value ? this.filter(value) : this.options.slice())),
        withLatestFrom(this.formControl.valueChanges.pipe(startWith([]))),
        takeUntil(this.destroy$)
      )
      .subscribe(([data]) => {
        this.filteredOptions = data.filter(item => !this.addedOptions.has(this.keyName ? item[this.keyName] : item));
        this.cd.markForCheck();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  ngAfterContentInit(): void {
    const ngControl: NgControl = this.injector.get(NgControl, []);
    if (ngControl) {
      this.formControl = ngControl.control as FormControl;
      this.handleDisabledAttributeState();

      this.formControl.statusChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
        this.chipList.errorState = val === 'INVALID';
      });

      this.formControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
        const targetName = this.getNameById(value);

        if (!targetName) {
          this.searchControl.setValue(value);
        }
      });
    }
  }

  ngOnChanges({ isDisabled, data }: SimpleChanges) {
    if (isDisabled && isDisabled.currentValue !== isDisabled.previousValue) {
      this.setDisabledState(isDisabled.currentValue);
    }

    if (data && !data.firstChange && data.currentValue) {
      this.setData(data.currentValue);
      this.searchControl.setValue('');
    }
  }

  onRemoveOption(option) {
    this.addedOptions.delete(option);
    this.onModelChange();
  }

  onFocusInput() {
    this.autocompleteTrigger.openPanel();
  }

  closePanel() {
    this.autocompleteTrigger.closePanel();
  }

  onLeaveInput() {
    if (!this.autocompleteTrigger.panelOpen) {
      this.resetInputIfNeeded();
    }

    this.chipList.errorState = this.formControl.status === 'INVALID';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  writeValue(items): void {
    if (!items) {
      return;
    }

    this.addedOptions = new Set(items);
  }

  onSelectOption(option) {
    this.resetInput();
    this.addedOptions.add(option);
    this.onModelChange();
  }

  private resetInput() {
    const ids: string[] = Array.from(this.addedOptions);
    this.formControl.setValue(ids);
    this.searchControl.setValue('');
    this.inputElem.nativeElement.value = '';
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  getKeyName(value) {
    if (TypeCheck.isObject(value)) {
      return value[this.keyName];
    }
    return value;
  }

  getDisplayName(value) {
    if (TypeCheck.isObject(value)) {
      return value[this.displayName];
    }
    return value;
  }

  getNameById(value) {
    const target = this.options?.find(item => this.getKeyName(item) === value);

    if (!target) {
      return '';
    }

    return this.getDisplayName(target);
  }

  onEnter(event) {
    event.preventDefault();

    if (this.filteredOptions.length === 1 && !TypeCheck.isArray(this.searchControl.value)) {
      const targetValue = this.keyName ? this.filteredOptions[0][this.keyName] : this.filteredOptions[0];
      this.onSelectOption(targetValue);
      this.closePanel();
    }
  }

  /*
   * Private Helpers
   * */
  private filter(filterValue: string): any[] {
    if (typeof filterValue !== 'string') {
      return this.options.slice();
    }

    return this.options.filter(option => {
      const itemName = this.getDisplayName(option).toLowerCase();
      const searchName = filterValue.toLowerCase();
      return itemName.includes(searchName);
    });
  }

  private setData(data: any[]): void {
    this.handleDisabledAttributeState();
    this.options = data || [];
  }

  private handleDisabledAttributeState() {
    this.isDisabled ? this.formControl.disable() : this.formControl.enable();
  }

  private setDefaults(): void {
    this.label = this.label || this.placeholder || 'Select...';
    this.placeholder = this.placeholder || this.label || 'Select...';
  }

  private resetInputIfNeeded() {
    if (TypeCheck.isString(this.searchControl.value)) {
      this.resetInput();
    }
  }

  private onModelChange() {
    const ids: string[] = Array.from(this.addedOptions);
    this.onChange(ids);
    this.onTouch();
  }
}
