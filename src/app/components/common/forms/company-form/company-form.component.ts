import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { takeUntil } from 'rxjs/operators';
import { ImageResourceType, MediaService } from '@services/app-layer/media/media.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { WebsiteUrlValidator } from '@validators/website.validator/websiteUrl.validator';
import { ImageUrlValidator } from '@validators/imageUrl.validator/imageUrl.validator';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CompanyDetails } from '@app/services/data-layer/http-api/base-api/swagger-gen';
import { User } from '@app/services/app-layer/entities/user';
import { ProfileCompletionState } from '@app/services/app-layer/app-layer.enums';

@Component({
  selector: 'app-company-form',
  templateUrl: './company-form.component.html',
  styleUrls: ['./company-form.component.scss']
})
export class CompanyFormComponent implements OnInit, OnDestroy {
  @Input() parentForm: FormGroup;
  @Input() initialData$: BehaviorSubject<CompanyDetails | any>;
  @Input() readonlyMode$: BehaviorSubject<boolean>;
  @Input() isCrm = false;

  public form: FormGroup;
  public name: FormControl;
  public logoUrl: FormControl;
  public website: FormControl;
  public streetAddress: FormControl;
  public country: FormControl;
  public state: FormControl;
  public city: FormControl;
  public zipCode: FormControl;

  public initialData: CompanyDetails | any;
  public readonlyMode: boolean;

  public ImageResourceType = ImageResourceType;

  public currentUser: User;
  public ProfileCompletionState = ProfileCompletionState;

  private destroy$ = new Subject<void>();

  constructor(private mediaService: MediaService) {}

  ngOnInit() {
    this.currentUser = Environment.getCurrentUser();
    this.mediaService.isFetching().pipe(takeUntil(this.destroy$)).subscribe();
    this.createFormControls();
    this.createForm();
    this.extendParentFormGroup(this.parentForm);
    this.initializeForm();

    if (this.readonlyMode$) {
      this.readonlyMode$.pipe(takeUntil(this.destroy$)).subscribe(value => {
        this.readonlyMode = value;
        this.setInitialData(this.initialData);
      });
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
    this.removeCurrentFormControl();
  }

  /*
   * Private Methods
   */
  private createFormControls(): void {
    this.name = new FormControl('', [Validators.required, Validators.maxLength(30)]);
    this.logoUrl = new FormControl('', [ImageUrlValidator(), Validators.maxLength(500)]);
    const requiredValidator = !this.isCrm ? [Validators.required] : [];
    this.website = new FormControl(null, [WebsiteUrlValidator(), Validators.maxLength(500), ...requiredValidator]);
    this.streetAddress = new FormControl('', [Validators.maxLength(50), ...requiredValidator]);
    this.country = new FormControl('', [Validators.maxLength(30), ...requiredValidator]);
    this.state = new FormControl('', [Validators.maxLength(30), ...requiredValidator]);
    this.city = new FormControl('', [Validators.maxLength(20), ...requiredValidator]);
    this.zipCode = new FormControl('', [Validators.maxLength(30), ...requiredValidator]);
  }

  private createForm(): void {
    this.form = new FormGroup({
      name: this.name,
      logoUrl: this.logoUrl,
      website: this.website,
      streetAddress: this.streetAddress,
      country: this.country,
      state: this.state,
      city: this.city,
      zipCode: this.zipCode
    });
  }

  private setInitialData(data: CompanyDetails | any): void {
    if (!data) return;

    const config = {
      logoUrl: this.initialData.logoUrl || '',
      name: data.name,
      website: data.website || '',
      streetAddress: data.streetAddress || '',
      country: data.country || '',
      state: data.state || '',
      city: data.city || '',
      zipCode: data.zipCode || ''
    };

    this.form.setValue(config);
    if (this.currentUser.companyId === data.id) this.name.disable();
  }

  private extendParentFormGroup(parentForm: FormGroup): void {
    parentForm.addControl('company', this.form || new FormGroup({}));
  }
  private removeCurrentFormControl(): void {
    this.parentForm.removeControl('company');
  }

  private initializeForm(): void {
    if (this.initialData$) {
      this.initialData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
        this.initialData = data;
        this.setInitialData(this.initialData);
      });
    }
  }
}
