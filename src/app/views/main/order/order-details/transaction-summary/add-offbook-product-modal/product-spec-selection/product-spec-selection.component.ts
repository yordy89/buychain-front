import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { MAT_CHECKBOX_DEFAULT_OPTIONS } from '@angular/material/checkbox';
import { SpecSelectionNode, SpecService } from '@services/app-layer/spec/spec.service';
import { Environment } from '@services/app-layer/app-layer.environment';
import crc16 from 'crc/crc16';
import { UserService } from '@services/app-layer/user/user.service';
import { SpecHelper } from '@services/helpers/utils/spec-helper';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-product-spec-selection',
  templateUrl: './product-spec-selection.component.html',
  styleUrls: ['./product-spec-selection.component.scss'],
  providers: [{ provide: MAT_CHECKBOX_DEFAULT_OPTIONS, useValue: { clickAction: 'noop' } }]
})
export class ProductSpecSelectionComponent implements OnDestroy {
  @Input() favoriteProductsList: any[];
  @Input() specsTree: SpecSelectionNode[];
  @Input() selectedProductGroup: SpecSelectionNode = null;
  @Output() createProduct = new EventEmitter<{ specs: any; shorthand: string }>();
  @Output() reloadPreferences = new EventEmitter<void>();
  @Output() initProductSpecs = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserService,
    private specService: SpecService,
    private notificationHelperService: NotificationHelperService
  ) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  canCreateProduct() {
    return this.selectedProductGroup && this.selectedProductGroup.isComplete();
  }

  onCreateProduct() {
    const payload = this.getFavoriteProduct();
    this.createProduct.emit({ specs: payload.specs, shorthand: payload.shorthand });
  }

  get currentProductSpec() {
    const payload = this.getFavoriteProduct();
    if (!payload) return '';
    return payload.shorthand
      .split(', ')
      .filter(item => item !== '' && item !== 'x ')
      .slice(0, -1)
      .join(', ');
  }

  addToUserProducts(): void {
    const payload = this.getFavoriteProduct();
    if (this.favoriteProductsList.some(item => ObjectUtil.isDeepEquals(item.value, payload.specs))) {
      return this.notificationHelperService.showValidation(
        'You already have this spec configuration in your favorites.'
      );
    }
    const crcKey = crc16(`products-favoriteSpecs-${new Date().getTime()}`).toString(16);
    const key = `products-favoriteSpecs-${crcKey}`;
    this.userService
      .updateUserPreferences(key, {
        key: key,
        specShorthand: payload.shorthand,
        product: payload.specs,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastRunAt: new Date(),
        version: Environment.currentVersion
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.reloadPreferences.emit());
  }

  clearProduct() {
    this.initProductSpecs.emit();
  }

  private getFavoriteProduct(): { specs: any; shorthand: string } {
    const selectedProduct = this.selectedProductGroup.innerSpecs[0]?.selected;
    if (!selectedProduct) return;
    const specs = selectedProduct.accumulateSelections();
    if (specs.cutTypes === Environment.randomLengthCutType) specs.length = { uom: 'feet', value: null, name: 'Random' };
    specs.productGroupName = this.selectedProductGroup.id;
    specs.productName = this.selectedProductGroup?.selected?.selected?.id;
    specs.unitPieceCount = '0';

    const template = selectedProduct.shorthandTemplate || this.selectedProductGroup.shorthandTemplate;
    const shorthand = SpecHelper.substituteTemplate(template, specs);
    return { specs: specs, shorthand: shorthand };
  }
}
