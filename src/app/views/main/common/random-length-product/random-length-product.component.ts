import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Environment } from '@services/app-layer/app-layer.environment';
import { ProductsService } from '@services/app-layer/products/products.service';
import { ProductStateEnum } from '@services/app-layer/app-layer.enums';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { ProductsHelper } from '@services/app-layer/products/products-helper';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IntegerValidator } from '@validators/integer.validator/integer.validator';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';

@Component({
  selector: 'app-random-length-product',
  templateUrl: './random-length-product.component.html',
  styleUrls: ['./random-length-product.component.scss']
})
export class RandomLengthProductComponent implements OnInit, OnDestroy, OnChanges {
  @Input() product: any; // ProductEntity;
  @Output() specChangedEmitter = new EventEmitter();

  readonlyMode = true;

  userPermissions = { canUpdateSpec: false };
  lengthUnitsSummary = {
    actualMeasure: 0,
    differenceWithEstimate: 0,
    actualWeight: 0
  };

  lengthUnits = [...Array(22).keys()].map(k => ({
    length: { value: k + 3, uom: 'feet', name: `${k + 3}'` },
    count: new FormControl(0, [Validators.min(0), Validators.max(100000), IntegerValidator()])
  }));

  isRandomLengthEditable: boolean;
  isRandomLengthsDefined: boolean;

  private destroy$ = new Subject<void>();

  constructor(private productService: ProductsService, private notificationHelperService: NotificationHelperService) {}

  ngOnInit(): void {
    this.setUserPermissions();
    this.setInitialData();
  }

  ngOnChanges({ product }: SimpleChanges) {
    if (product?.currentValue) {
      this.isRandomLengthEditable = this.checkIfRandomLengthIsEditable();
      this.isRandomLengthsDefined = !!this.product?.spec?.lengthUnits?.length;
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateProductRandomLengthUnits(): void {
    if (this.lengthUnits.some(unit => unit.count.invalid)) {
      return this.notificationHelperService.showValidation(
        'Please make sure to provide proper numbers for units counts.'
      );
    }
    const payload = this.lengthUnits
      .filter(unit => unit.count.value && unit.count.value > 0)
      .map(unit => ({ length: unit.length, count: unit.count.value }));
    const productId = this.product.id;
    this.productService
      .updateProductSpecLengthUnits(productId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(response => {
        this.product = { ...this.product, spec: { ...this.product.spec, lengthUnits: response } };
        if (this.specChangedEmitter) this.specChangedEmitter.emit();
        this.toggleEditMode(true);
        this.setInitialData();
      });
  }

  toggleEditMode(value: boolean): void {
    this.readonlyMode = value;
  }

  cancelChanges(): void {
    this.readonlyMode = true;
    this.setInitialData();
  }

  private checkIfRandomLengthIsEditable(): boolean {
    return this.product.state === ProductStateEnum.ON_ORDER;
  }

  private setInitialData(): void {
    if (!this.product?.spec?.lengthUnits) return;
    this.lengthUnits.forEach(unit => {
      const foundLength = this.product.spec.lengthUnits.find(x => x.length.name === unit.length.name);
      unit.count.setValue(foundLength?.count || 0);
    });
    this.calculateSummaries();
  }

  private setUserPermissions(): void {
    const product = this.product;
    const productAccessRoles =
      Environment.getCurrentUser().normalizedAccessControlRoles.PRODUCT.updateSection.sectionGroup;
    this.userPermissions.canUpdateSpec =
      productAccessRoles.updateSpecLengthUnit.value === AccessControlScope.Company ||
      (productAccessRoles.updateSpecLengthUnit.value === AccessControlScope.Owner &&
        Environment.getCurrentUser().id === product.owner);
  }

  private calculateSummaries(): void {
    const lengthUnits = this.product?.spec?.lengthUnits;
    Object.keys(this.lengthUnitsSummary).forEach(k => (this.lengthUnitsSummary[k] = 0));
    if (!lengthUnits?.length) return;
    const units = lengthUnits.reduce(
      (acc, cur) => [
        ...acc,
        ...[...Array(cur.count).keys()].map(() => ({
          ...this.product,
          spec: { ...this.product.spec, length: cur.length }
        }))
      ],
      []
    );
    units.map(u => {
      this.lengthUnitsSummary.actualMeasure += ProductsHelper.getProductLotUnitMeasure(u.spec);
      this.lengthUnitsSummary.actualWeight += ProductsHelper.getProductLotUnitWeight(u.spec);
    });
    this.lengthUnitsSummary.differenceWithEstimate =
      ProductsHelper.getProductLotUnitMeasure(this.product.spec) - this.lengthUnitsSummary.actualMeasure;
  }
}
