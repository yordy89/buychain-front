import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SpecSelectionNode, SpecService } from '@app/services/app-layer/spec/spec.service';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { UserService } from '@services/app-layer/user/user.service';
import { AddOffbookProductModalService } from '@views/main/order/order-details/transaction-summary/add-offbook-product-modal/add-offbook-product-modal.service';
import { FavoriteProductsComponent } from '@views/main/order/order-details/transaction-summary/add-offbook-product-modal/favorite-products/favorite-products.component';
import { addDays, max, format } from 'date-fns';
import { first, takeUntil } from 'rxjs/operators';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { User } from '@app/services/app-layer/entities/user';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { TallyGridComponent } from './tally-grid/tally-grid.component';
import { ProductsService } from '@services/app-layer/products/products.service';
import { NotificationHelperService } from '@app/services/helpers/notification-helper/notification-helper.service';
import { TransactionsService } from '@app/services/app-layer/transactions/transactions.service';
import { TransactionEntity } from '@app/services/app-layer/entities/transaction';
import { CompaniesSummary } from '@app/services/data-layer/http-api/base-api/swagger-gen';
import { CrmAccountEntity, CrmContactEntity, CrmLocationEntity } from '@services/app-layer/entities/crm';
import { combineLatest, concat, of, Subject } from 'rxjs';
import { Environment } from '@app/services/app-layer/app-layer.environment';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { TransactionStateEnum } from '@services/app-layer/app-layer.enums';
import crc16 from 'crc/crc16';

enum ViewPage {
  SellerForm = 'SELLER_FORM',
  ProductForm = 'PRODUCT_FORM'
}

@Component({
  selector: 'app-add-offbook-product-modal',
  templateUrl: './add-offbook-product-modal.component.html',
  styleUrls: ['./add-offbook-product-modal.component.scss']
})
export class AddOffbookProductModalComponent implements OnInit, OnDestroy {
  @ViewChild(FavoriteProductsComponent) favoriteProducts: FavoriteProductsComponent;
  @ViewChild(TallyGridComponent) tallyGrid: TallyGridComponent;
  isLoaded = false;

  crmAccounts: CrmAccountEntity[] = [];
  crmLocations: CrmLocationEntity[] = [];
  crmContacts: CrmContactEntity[] = [];
  selectedAccountLocations: CrmLocationEntity[] = [];
  selectedAccountContacts: CrmContactEntity[] = [];
  companies: CompaniesSummary;
  users: User[];
  favoriteProductsList: any[] = [];
  productsTemplates: any[] = [];

  specsTree: SpecSelectionNode[];

  selectedProductGroup: SpecSelectionNode;

  sellerCRMFormGroup: FormGroup;
  crmAccount = new FormControl();
  crmContact = new FormControl();
  crmLocation = new FormControl();

  ViewPage = ViewPage;
  pageState: ViewPage = ViewPage.SellerForm;
  selectedIndex = 0;

  tallyData: Array<any> = [];

  priceSystemOverTally = '';

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(MAT_DIALOG_DATA) private transactionData: TransactionEntity,
    private dialogRef: MatDialogRef<AddOffbookProductModalComponent>,
    private specService: SpecService,
    private productService: ProductsService,
    private transactionsService: TransactionsService,
    private notificationService: NotificationHelperService,
    private addOffbookProductModalService: AddOffbookProductModalService,
    private userService: UserService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.addOffbookProductModalService
      .getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(([crmAccounts, crmContacts, crmLocations]) => {
        this.crmAccounts = crmAccounts;
        this.crmContacts = crmContacts;
        this.crmLocations = crmLocations;
        this.setTallyPriceSystem();
        this.initializeCrmForm();
        this.initializeProductSpecs();
        this.setPredefinedSeller();
        this.loadUserProductPreferences();
        this.loadProductsTemplates();
        this.initPageState();
        this.isLoaded = true;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  onCreateFromTemplate(template) {
    const shorthand = template.specShorthand;
    const specs = template.specs;

    const shipWeekDate = max([new Date(template.shipWeek), addDays(new Date(), 1)]);
    const shipWeek = format(shipWeekDate, 'yyyy-MM-dd');

    const addedTallyUnits = this.tallyGrid.tallyFormItems.value;

    if (this.isDifferentPriceSystem(addedTallyUnits, specs.priceSystems)) {
      return this.notificationService.showValidation('The price system across the tally should be the same.');
    }

    if (this.isDifferentShipFrom(addedTallyUnits, template?.offlineData.shipFromId)) {
      return this.notificationService.showValidation('The Ship From Facility across the tally should be the same.');
    }

    this.tallyGrid.addItemFromTemplate(
      shorthand,
      specs,
      template.unitPieceCount,
      template.listPricePerUoM,
      specs.priceSystems,
      shipWeek,
      template.mfgFacilityShortName,
      template.offlineData
    );

    this.setSelectedSeller(template.offlineData.organizationId);
    this.setSelectedCrmLocation(template.offlineData.shipFromId);
    this.setSelectedCrmContact(template.offlineData.sellingContactId);

    this.notificationService.showSuccess('Ship From info is set automatically from the template.');
  }

  onCreateProduct(product) {
    const { specs, shorthand } = product;
    const crmAccountId = this.crmAccount.value.id;
    const crmLocationId = this.crmLocation.value.id;
    const shipWeek = addDays(new Date(), 1).toISOString().substring(0, 10);

    const addedTallyUnits = this.tallyGrid.tallyFormItems.value;

    if (this.isDifferentPriceSystem(addedTallyUnits, specs.priceSystems)) {
      return this.notificationService.showValidation('The price system across the tally should be the same.');
    }

    this.tallyGrid.addItem(
      shorthand.slice(0, -6),
      specs,
      null,
      null,
      null,
      specs.priceSystems,
      shipWeek,
      crmAccountId,
      crmLocationId
    );
  }

  private isDifferentPriceSystem(tallyUnits, priceSystems) {
    return (
      (tallyUnits?.length && tallyUnits[0]?.priceSystem && tallyUnits[0].priceSystem !== priceSystems) ||
      (this.priceSystemOverTally && this.priceSystemOverTally !== priceSystems)
    );
  }

  private isDifferentShipFrom(tallyUnits, crmLocationId) {
    const filteredUnits = tallyUnits.filter(item => !!item.offlineData);

    if (!filteredUnits.length || !crmLocationId) {
      return false;
    }

    return filteredUnits[0].offlineData.shipFromId !== crmLocationId;
  }

  loadUserProductPreferences(): void {
    this.favoriteProductsList = this.addOffbookProductModalService.getUserProductPreferences();
  }

  loadProductsTemplates() {
    this.productsTemplates = this.addOffbookProductModalService.getProductsTemplatesPreferences();
  }

  onRefreshTemplates() {
    this.loadProductsTemplates();
  }

  canSubmit(): boolean {
    return !!(this.tallyGrid && this.tallyGrid.getItems().length);
  }

  async submit() {
    this.tallyGrid.markAllTouched();
    if (!this.tallyGrid.isAllValid()) return;

    try {
      this.tallyData = this.tallyGrid.getItems();
      for (const item of this.tallyData) {
        const tallyItem = this.mapToApiProductLot(item);
        const count = item.specs.cutTypes === Environment.randomLengthCutType ? 1 : item.quantity;
        const products = await this.productService.addProductsBulk(count, tallyItem).pipe(first()).toPromise();

        await combineLatest(
          products.map(p =>
            this.transactionsService.addTransactionTallyUnit(this.transactionData.id, {
              product: p.id,
              offer: p.salesData.priceOfMerit
            })
          )
        )
          .pipe(first())
          .toPromise();
      }

      this.dialogRef.close('confirm');
    } catch (error) {
      console.log(error);
      const message = error.error ? error.error.message : error.message;
      this.notificationService.showValidation(message);
    }
  }

  onBackToSellerForm() {
    if (!this.tallyGrid.getItems()?.length) {
      this.pageState = ViewPage.SellerForm;
      return;
    }

    this.dialog
      .open(DialogModalComponent, {
        width: '450px',
        disableClose: true,
        data: {
          type: DialogType.Confirm,
          content: 'All added tally items will be lost. Are you sure you want to continue?'
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.pageState = ViewPage.SellerForm;
        }
      });
  }

  onCreateTemplates(items) {
    let skippedTemplatesCount = 0;
    const set = new Set();

    const requests = items.map(item => {
      const key = this.getTemplatesStorageKey();
      const mfgFacilityShortName = this.getMfgFacilityShortName(item);
      const offlineData = this.getOfflineData(item);
      const payload = this.addOffbookProductModalService.mapToTemplateItem(
        item,
        key,
        mfgFacilityShortName,
        offlineData
      );
      const simplifiedPayloadString = JSON.stringify(this.getSimplifiedTemplatePayload(payload));

      if (this.checkTemplateAlreadyExists(payload) || set.has(simplifiedPayloadString)) {
        skippedTemplatesCount++;
        return of(null);
      }

      set.add(simplifiedPayloadString);

      return this.userService.updateUserPreferences(payload.key, payload);
    });

    concat(...requests)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadProductsTemplates();
        this.selectedIndex = 0;

        if (skippedTemplatesCount) {
          const message = skippedTemplatesCount === 1 ? 'Duplicate item was skipped' : 'Duplicate items were skipped';
          this.notificationService.showValidation(message);
        }
      });
  }

  private checkTemplateAlreadyExists(tpl) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const templates = this.productsTemplates.map(({ key, value, shipWeek, ...data }) => data);
    const newTemplate = this.getSimplifiedTemplatePayload(tpl);
    return templates.some(template => ObjectUtil.isDeepEquals(template, newTemplate));
  }

  private getSimplifiedTemplatePayload(template) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { key, createdAt, updatedAt, lastRunAt, version, shipWeek, ...newTemplate } = template;
    return newTemplate;
  }

  onSelectTemplates() {
    this.pageState = ViewPage.ProductForm;
    this.selectedIndex = 0;
  }

  moveToProductSelection(): void {
    this.pageState = ViewPage.ProductForm;
    this.selectedIndex = 1;
  }

  onOpenProductSpec(spec): void {
    this.selectedProductGroup = spec;
    this.specsTree = this.specsTree.map(item => (item.id === spec.id ? spec : item));
    this.switchTabToSpecsSelection();
  }

  switchTabToSpecsSelection(): void {
    this.selectedIndex = 2;
  }

  get isSellerFormPopulated() {
    return this.sellerCRMFormGroup?.disabled || this.sellerCRMFormGroup.valid;
  }

  close() {
    this.dialogRef.close();
  }

  onSelectedTabChanged(): void {
    this.favoriteProducts?.repaintGrid();
  }

  initializeProductSpecs() {
    this.specsTree = Environment.getUiProducts().productGroups.map(specs =>
      this.specService.transformToSpecSelectionTree(specs)
    );
    this.selectedProductGroup = this.specsTree[0];
    this.selectedProductGroup.selected = this.selectedProductGroup.innerSpecs[0];
  }

  /*
   * private helpers
   * */

  private initPageState() {
    if (this.productsTemplates?.length) {
      this.selectedIndex = 0;
    } else if (this.favoriteProductsList?.length) {
      this.selectedIndex = 1;
    } else {
      this.selectedIndex = 2;
    }

    if (this.productsTemplates.length) {
      this.pageState = ViewPage.ProductForm;
    }
  }

  private getMfgFacilityShortName(item) {
    if (item.mfgFacilityShortName) {
      return item.mfgFacilityShortName;
    }
    const crmAccount = this.crmAccounts.find(x => x.id === item.crmAccountId);
    const crmLocation = this.crmLocations.find(x => x.id === item.crmLocationId);
    return `${crmAccount.name} - ${crmLocation.shortName}`;
  }

  private getOfflineData(item) {
    if (item.offlineData) {
      return item.offlineData;
    }

    return this.addOffbookProductModalService.getOfflineData(
      this.crmAccount.value.id,
      this.crmLocation.value.id,
      this.crmContact.value.id
    );
  }

  private getTemplatesStorageKey() {
    const crcKey = crc16(`products-templates-${Math.random()}`).toString(16);
    return `products-templates-${crcKey}`;
  }

  private initializeCrmForm() {
    this.crmAccount = new FormControl('', [Validators.required]);
    this.crmContact = new FormControl('', [Validators.required]);
    this.crmLocation = new FormControl('', [Validators.required]);
    this.sellerCRMFormGroup = new FormGroup({
      crmAccount: this.crmAccount,
      crmLocation: this.crmLocation,
      crmContact: this.crmContact
    });

    this.crmAccount.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.onCrmAccountChange());
    this.crmContact.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => this.loadProductsTemplates());
  }

  private onCrmAccountChange(): void {
    if (!this.crmAccount.value) return;

    this.crmLocation.setValue('', { emitEvent: false });
    this.crmContact.setValue('', { emitEvent: false });

    this.selectedAccountLocations = this.crmLocations.filter(l => l.crmAccountId === this.crmAccount.value.id);
    this.selectedAccountContacts = this.crmContacts.filter(c => c.crmAccountId === this.crmAccount.value.id);
  }

  private mapToApiProductLot(item): any {
    const mfgFacilityShortName = this.getMfgFacilityShortName(item);
    const offlineData = this.getOfflineData(item);

    return this.addOffbookProductModalService.mapToApiProductLot(item, mfgFacilityShortName, offlineData);
  }

  private setPredefinedSeller() {
    const sellerCompany = this.transactionData.sellerCompany;
    if (ObjectUtil.isEmptyObject(sellerCompany)) return;
    this.setSelectedSeller(sellerCompany.id);

    const shipFrom = this.transactionData.shipFrom;
    if (shipFrom) this.setSelectedCrmLocation(shipFrom.id);

    const seller = this.transactionData.seller;
    if (seller) this.setSelectedCrmContact(seller.id);

    if (this.sellerCRMFormGroup.valid && this.transactionData.tally?.units?.length) {
      this.sellerCRMFormGroup.disable({ emitEvent: false });
      this.pageState = ViewPage.ProductForm;
    }
    if (this.transactionData.state === TransactionStateEnum.Quote) this.crmAccount.disable({ emitEvent: false });
  }

  private setSelectedSeller(id: string): void {
    const crmAccount = this.crmAccounts.find(x => x.id === id);
    if (!crmAccount) return;
    this.crmAccount.setValue(crmAccount);
    this.onCrmAccountChange();
  }

  private setSelectedCrmLocation(id: string): void {
    const crmLocation = this.crmLocations.find(x => x.id === id);
    if (!crmLocation) return;
    this.crmLocation.setValue(crmLocation);
  }

  private setSelectedCrmContact(id: string): void {
    const crmContact = this.crmContacts.find(x => x.id === id);
    if (!crmContact) return;
    this.crmContact.setValue(crmContact);
  }

  private setTallyPriceSystem(): void {
    if (!this.transactionData.tallyUnits.length) return;
    this.priceSystemOverTally = this.transactionData.tally.priceSystem;
  }
}
