import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { InventorySearchEntity, ProductEntity } from '@services/app-layer/entities/inventory-search';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { ProductLotPermissionEnum } from '@services/app-layer/app-layer.enums';
import { MemberEntity } from '@services/app-layer/entities/member';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { ProductLotAccessRoles, ProductsHelper } from '@services/app-layer/products/products-helper';
import { Observable, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ProductsService } from '@services/app-layer/products/products.service';
import { InventorySearchHelperService } from '@views/main/common/inventory/inventory-search/inventory-search.helper.service';
import { CompaniesService } from '@services/app-layer/companies/companies.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { addDays, startOfDay } from 'date-fns';
import { first, map, mergeMap, takeUntil } from 'rxjs/operators';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { DateValidator } from '@validators/date.validator/date.validator';

@Component({
  selector: 'app-product-lot-details',
  templateUrl: './product-lot-details.component.html',
  styleUrls: ['./product-lot-details.component.scss']
})
export class ProductLotDetailsComponent implements OnInit, OnDestroy {
  @Input() lotId: string;
  @Output() noLotData = new EventEmitter();

  public isChanged = false;
  productLotData: InventorySearchEntity;
  productsList: ProductEntity[];

  lotForm: FormGroup;
  salesNotes: FormControl;
  permission: FormControl;
  ownerId: FormControl;
  priceOfMerit: FormControl;
  shipWeekEstimate: FormControl;

  permissionsList = ObjectUtil.enumToArray(ProductLotPermissionEnum);
  membersList: MemberEntity[];
  crmAccounts: CrmAccountEntity[];
  currentDate: Date;
  productLotAccessRoles: ProductLotAccessRoles;

  isRandomLengthProduct = false;

  lotUnitMeasure: number;
  lotUnitMeasureLabel: string;
  lotTotalMeasureInUoM: number;

  get tooltipHasAllocatedProducts(): string {
    return this.productLotData?.hasAllocatedProducts
      ? 'Lot has allocated or sold products. Please separate active products before editing.'
      : '';
  }

  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private productsService: ProductsService,
    private inventorySearchHelperService: InventorySearchHelperService,
    private companiesService: CompaniesService,
    private notificationHelperService: NotificationHelperService,
    private navigationHelperService: NavigationHelperService,
    private crmService: CrmService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.currentDate = addDays(startOfDay(new Date()), 1);
    this.createFormControls();
    this.createForm();
    this.loadLotData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.setInitialData());

    this.loadCrmAccounts();
    this.loadCompanyMembers();
    this.handleControlsValueChanges();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  onProductUpdate() {
    this.isChanged = true;
    this.cd.detectChanges();
    this.loadLotData().pipe(takeUntil(this.destroy$)).subscribe();
  }

  randomLengthProductChanged(): void {
    this.isChanged = true;
  }

  /*
   * private helpers
   * */

  private loadLotData(): Observable<void> {
    return this.inventorySearchHelperService.loadLotById(this.lotId).pipe(
      first(),
      map(lot => {
        if (!lot) this.noLotData.emit();
        else {
          this.productLotData = lot;
          this.productsList = this.productLotData.products;
          this.setProductLotAccessRoles();
          this.handleDisabledMode();
          this.calcSummaries();
          this.handleRandomLengthUnit();
        }
      })
    );
  }

  private handleControlsValueChanges(): void {
    this.handleOwnerChange();
    this.handlePermissionChange();
    this.handleSalesNotesChange();
    this.handlePriceOfMeritChange();
    this.handleShipWeekEstimateChange();
  }

  private handleOwnerChange(): void {
    this.ownerId.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        mergeMap(() =>
          this.openChangeOwnerConfirmation().pipe(
            map(confirmed => {
              if (!confirmed) this.ownerId.setValue(this.productLotData.ownerId, { emitEvent: false });
              return this.ownerId.value;
            })
          )
        )
      )
      .subscribe(value => {
        if (value === this.productLotData.ownerId) return;
        this.productsService
          .updateLotsOwnerBulk([this.productLotData.lotId], value)
          .pipe(takeUntil(this.destroy$))
          .subscribe(result => {
            this.handleFormControlUpdate(result, () => {
              this.setProductLotAccessRoles();
              this.handleDisabledMode();
            });
          });
      });
  }

  private handlePermissionChange(): void {
    this.permission.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.productsService
        .updateLotsPermissionBulk([this.productLotData.lotId], value)
        .pipe(takeUntil(this.destroy$))
        .subscribe(result => {
          this.handleFormControlUpdate(result);
        });
    });
  }

  private handleSalesNotesChange(): void {
    this.salesNotes.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      if (this.salesNotes.invalid) return;
      this.productsService
        .updateLotsSalesNotesBulk([this.productLotData.lotId], value)
        .pipe(takeUntil(this.destroy$))
        .subscribe(result => {
          this.handleFormControlUpdate(result);
        });
    });
  }

  private handlePriceOfMeritChange(): void {
    this.priceOfMerit.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      if (this.priceOfMerit.invalid) return;
      this.productsService
        .updateLotsPriceOfMeritBulk([this.productLotData.lotId], value)
        .pipe(takeUntil(this.destroy$))
        .subscribe(result => {
          this.handleFormControlUpdate(result);
        });
    });
  }

  private handleShipWeekEstimateChange(): void {
    this.shipWeekEstimate.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      if (this.shipWeekEstimate.invalid) return;
      this.productsService
        .updateLotsShipWeekEstimateBulk([this.productLotData.lotId], value)
        .pipe(takeUntil(this.destroy$))
        .subscribe(result => {
          this.handleFormControlUpdate(result);
        });
    });
  }

  private handleFormControlUpdate(result, callback?) {
    this.handleModifiedLessThenMatched(result);
    this.isChanged = true;
    this.loadLotData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (callback) {
          callback();
        }
      });
  }

  private handleModifiedLessThenMatched(result: { matchedDocuments?: number; modifiedDocuments?: number }): void {
    if (!result.matchedDocuments)
      this.notificationHelperService.showValidation('No entries match the criteria for update.');
    else if (result.modifiedDocuments < result.matchedDocuments) {
      this.notificationHelperService.showValidation('Not all lots has successfully been updated. Please reload.');
    }
  }

  private openChangeOwnerConfirmation(): Observable<boolean> {
    return this.dialog
      .open(DialogModalComponent, {
        width: '450px',
        disableClose: true,
        data: {
          type: DialogType.Confirm,
          content: 'Are You sure you want to change the owner?'
        }
      })
      .afterClosed();
  }

  private handleDisabledMode(): void {
    this.productLotAccessRoles.canUpdateOwner
      ? this.ownerId.enable({ emitEvent: false })
      : this.ownerId.disable({ emitEvent: false });
    this.productLotAccessRoles.canUpdatePermission
      ? this.permission.enable({ emitEvent: false })
      : this.permission.disable({ emitEvent: false });
    this.productLotAccessRoles.canUpdateSalesNotes
      ? this.salesNotes.enable({ emitEvent: false })
      : this.salesNotes.disable({ emitEvent: false });
    this.productLotAccessRoles.canUpdatePriceOfMerit
      ? this.priceOfMerit.enable({ emitEvent: false })
      : this.priceOfMerit.disable({ emitEvent: false });
    this.productLotAccessRoles.canUpdateShipWeekEstimate
      ? this.shipWeekEstimate.enable({ emitEvent: false })
      : this.shipWeekEstimate.disable({ emitEvent: false });
  }

  private createFormControls(): void {
    this.salesNotes = new FormControl('', { updateOn: 'blur', validators: [Validators.maxLength(500)] });
    this.permission = new FormControl('', [Validators.required]);
    this.ownerId = new FormControl('', [Validators.required]);
    this.priceOfMerit = new FormControl('', {
      updateOn: 'blur',
      validators: [Validators.required, Validators.min(0)]
    });
    this.shipWeekEstimate = new FormControl('', [Validators.required, DateValidator({ min: new Date() })]);
  }

  private createForm(): void {
    this.lotForm = new FormGroup({
      ownerId: this.ownerId,
      salesNotes: this.salesNotes,
      permission: this.permission,
      priceOfMerit: this.priceOfMerit,
      shipWeekEstimate: this.shipWeekEstimate
    });
  }

  private setInitialData(): void {
    const notesRequired = this.productLotData.salesNotes ? [Validators.required] : [];
    this.salesNotes.setValue(this.productLotData.salesNotes, { emitEvent: false });
    this.salesNotes.setValidators([...notesRequired, Validators.maxLength(500)]);
    this.permission.setValue(this.productLotData.permission, { emitEvent: false });
    this.ownerId.setValue(this.productLotData.ownerId, { emitEvent: false });
    this.priceOfMerit.setValue(this.productLotData.priceOfMerit, { emitEvent: false });
    this.shipWeekEstimate.setValue(this.productLotData.shipWeekEstimate, { emitEvent: false });
  }

  private setProductLotAccessRoles(): void {
    this.productLotAccessRoles = ProductsHelper.getProductLotAccessRoles(this.productLotData);
  }

  private loadCompanyMembers(): void {
    this.companiesService
      .getCompanyCompleteMembers()
      .pipe(takeUntil(this.destroy$))
      .subscribe(members => (this.membersList = members));
  }
  private loadCrmAccounts(): void {
    this.crmService
      .getAccounts(true)
      .pipe(takeUntil(this.destroy$))
      .subscribe(members => (this.crmAccounts = members));
  }

  private calcSummaries() {
    this.lotUnitMeasure = ProductsHelper.getProductLotUnitMeasure(this.productLotData.spec);
    this.lotUnitMeasureLabel = ProductsHelper.getMeasureLabel(this.productLotData.spec);
    this.lotTotalMeasureInUoM = ProductsHelper.getProductLotMeasuresInUom(
      this.productLotData.spec,
      this.productsList?.length || 0
    );
  }

  private handleRandomLengthUnit(): void {
    const product = this.productsList[0];
    this.isRandomLengthProduct = ProductsHelper.isRandomLengthProduct(product);
  }
}
