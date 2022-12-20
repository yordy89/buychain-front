import {
  AfterContentInit,
  ChangeDetectorRef,
  Component,
  forwardRef,
  Injector,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  NG_VALUE_ACCESSOR,
  NgControl,
  ValidationErrors,
  Validator
} from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatFormFieldAppearance } from '@angular/material/form-field';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-autocomplete',
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true
    }
  ]
})
export class AutocompleteComponent
  implements OnInit, OnDestroy, ControlValueAccessor, AfterContentInit, OnChanges, Validator
{
  @Input() iconName: string;
  @Input() placeholder: string;
  @Input() label: string;
  @Input() data: any[] = [];
  @Input() keyName: string;
  @Input() displayName: string;
  @Input() isRequired = false;
  @Input() isDisabled = false;
  @Input() isCustomAllowed = false;
  @Input() isValid = true;
  @Input() appearance: MatFormFieldAppearance = 'outline';
  @Input() fullWidth = true;
  @Input() nullAllowed = false;
  @Input() emptyValue = '';
  @Input() panelWidth = null;
  @ViewChild('autocomplete') autocompleteTrigger: MatAutocompleteTrigger;

  formControl: FormControl = new FormControl();
  filteredOptions: any[] = [];

  private searchControl: FormControl = new FormControl();
  private options: any[] = [];
  private destroy$ = new Subject<void>();
  private onChange: (value: string) => void;
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
        takeUntil(this.destroy$)
      )
      .subscribe(data => {
        this.filteredOptions = data;
        this.cd.markForCheck();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  ngAfterContentInit(): void {
    const ngControl: NgControl = this.injector.get(NgControl, null);
    if (ngControl) {
      this.formControl = ngControl.control as FormControl;
      this.handleDisabledAttributeState();
      this.formControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
        this.searchControl.setValue(value);
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

  onFocusInput() {
    this.autocompleteTrigger.openPanel();
  }

  closePanel() {
    this.autocompleteTrigger.closePanel();
  }

  onBlurInput(event) {
    if (this.autocompleteTrigger.panelOpen || event?.relatedTarget?.className.includes('clear-icon')) {
      return;
    }

    this.onLeaveInput();
  }

  onLeaveInput() {
    if (this.isCustomAllowed) {
      this.onChange(this.formControl.value);
      return;
    }

    if (!this.hasValue) {
      this.clearSelection();
      return;
    }

    const name = this.getNameById(this.formControl.value);

    if (!name) {
      this.notificationHelperService.showValidation('Please, choose from the list');
      this.clearSelection();
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  writeValue(key: string): void {
    this.updateSearchValue(key);
  }

  validate(): ValidationErrors | null {
    return !this.isValid && this.isRequired ? { return: true } : null;
  }

  private updateSearchValue(key) {
    let name = this.getNameById(key);

    if (!name && key && this.isCustomAllowed) {
      const options = this.options.concat(this.getNewItem(key));
      this.setData(options);
      name = key;
    }
    this.searchControl.setValue(name);
  }

  private getNewItem(key) {
    if (this.keyName && this.displayName) {
      return {
        [this.keyName]: key,
        [this.displayName]: key
      };
    }
    return key;
  }

  onOptionChange(key: string): void {
    // Notify FormGroup if passed, TODO handle case '0' explicitly.
    this.formControl.setValue(key);
    const name = this.getNameById(key);
    this.searchControl.setValue(name);
    this.onChange(key);
  }

  onClearSelection(): void {
    this.clearSelection();
  }

  private clearSelection() {
    this.onOptionChange(this.emptyValue);
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
      return this.isCustomAllowed ? value : '';
    }

    return this.getDisplayName(target);
  }

  onEnter(event) {
    event.preventDefault();

    if (this.filteredOptions.length === 1) {
      const targetValue = this.keyName ? this.filteredOptions[0][this.keyName] : this.filteredOptions[0];
      this.onOptionChange(targetValue);
      this.closePanel();
    }
  }

  get hasValue() {
    const value = this.formControl.value;

    if (value === null && this.nullAllowed) {
      return true;
    }

    return !!value;
  }

  /*
   * Private Helpers
   * */
  private filter(filterValue: string): any[] {
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
}
