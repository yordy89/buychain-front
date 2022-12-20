import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MemberEntity } from '@services/app-layer/entities/member';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ProductsService } from '@services/app-layer/products/products.service';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { combineLatest } from 'rxjs';

interface Lot {
  permission: string;
  lotId: string;
  priceOfMerit: string;
  shipWeekEstimate: string;
  ownerId?: string;
  salesNotes?: string;
}

@Component({
  selector: 'app-bulk-edit-product-lot-modal',
  templateUrl: './bulk-edit-product-lot-modal.component.html',
  styleUrls: ['./bulk-edit-product-lot-modal.component.scss']
})
export class BulkEditProductLotModalComponent {
  public priceOfMeritActions = ['Set To', 'Increase By', 'Decrease By']; // TODO make an enum

  public shipWeekEstimate = new FormControl();
  public salesNotes = new FormControl('', [Validators.maxLength(500)]);
  public permission = new FormControl();
  public ownerId = new FormControl();
  public priceOfMerit = new FormControl(null, [Validators.min(0)]);
  public priceOfMeritAction = new FormControl(this.priceOfMeritActions[0]);
  public form = new FormGroup({
    shipWeekEstimate: this.shipWeekEstimate,
    salesNotes: this.salesNotes,
    permission: this.permission,
    ownerId: this.ownerId,
    priceOfMerit: this.priceOfMerit
  });

  constructor(
    private dialogRef: MatDialogRef<BulkEditProductLotModalComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      membersList: MemberEntity[];
      permissionsList: [];
      productLots: Lot[];
      groupKey: string;
      minShipWeekEstimate: Date;
      editMode: string; // TODO make an enum
    },
    private productsService: ProductsService,
    private notificationService: NotificationHelperService
  ) {}

  public submit() {
    const effectedLots: Array<{ newValue; ids: string[] }> = [];

    for (const lot of this.data.productLots) {
      const dirtyValues = this.form.value;
      const changes = this.detectChanges(dirtyValues, lot);
      const hasChanges = Object.keys(changes).length > 0;
      if (!hasChanges) continue;

      let newValue: any;

      switch (this.data.editMode) {
        case 'priceOfMerit':
          newValue = changes.priceOfMerit;
          break;
        case 'shipWeekEstimate':
          newValue = changes.shipWeekEstimate;
          break;
        case 'permission':
          newValue = changes.permission;
          break;
        case 'owner':
          newValue = changes.ownerId;
          break;
        case 'notes':
          newValue = changes.salesNotes;
          break;
        default:
          throw new Error('Unexpected edit mode.');
      }

      const exist = effectedLots.find(x => x.newValue === newValue);
      exist ? exist.ids.push(lot.lotId) : effectedLots.push({ newValue: newValue, ids: [lot.lotId] });
    }

    const operations = effectedLots.map(x => {
      switch (this.data.editMode) {
        case 'priceOfMerit':
          return this.productsService.updateLotsPriceOfMeritBulk(x.ids, x.newValue);
        case 'shipWeekEstimate':
          return this.productsService.updateLotsShipWeekEstimateBulk(x.ids, x.newValue);
        case 'permission':
          return this.productsService.updateLotsPermissionBulk(x.ids, x.newValue);
        case 'owner':
          return this.productsService.updateLotsOwnerBulk(x.ids, x.newValue);
        case 'notes':
          return this.productsService.updateLotsSalesNotesBulk(x.ids, x.newValue);
        default:
          throw new Error('Unexpected edit mode.');
      }
    });

    let success = 0;
    let failure = 0;

    if (!operations?.length) return this.notificationService.showValidation('There are no affected lots.');

    combineLatest(operations)
      .pipe()
      .subscribe(results => {
        success = results.reduce((acc, item) => (acc += item.modifiedDocuments), 0);
        const matched = results.reduce((acc, item) => (acc += item.matchedDocuments), 0);
        failure = matched - success;

        const lotIds = effectedLots.reduce((acc, cur) => [...acc, ...cur.ids], []);
        this.notificationService.showSuccess(
          `${success} of ${matched} selected products successfully updated, ${failure} failed.`
        );
        this.dialogRef.close(success > 0 ? lotIds : []);
      });
  }

  public onClose() {
    this.dialogRef.close();
  }

  private detectChanges(dirtyValues, lot) {
    const changes: any = {};

    Object.keys(dirtyValues).forEach(key => {
      const oldValue = lot[key];
      let newValue = dirtyValues[key];

      if (newValue || typeof dirtyValues[key] === 'number') {
        if (key === 'priceOfMerit') {
          newValue = this.calcNewPriceOfMerit(lot[key], dirtyValues[key]);
        }

        if (newValue !== oldValue) {
          changes[key] = newValue;
        }
      }
    });

    return changes;
  }

  private calcNewPriceOfMerit(current, change) {
    if (change < 0) return current;

    switch (this.priceOfMeritAction.value) {
      case 'Set To':
        return change;
      case 'Increase By':
        return (current += change);
      case 'Decrease By':
        return (current -= Math.min(change, current)); // decrease max to Zero
      default:
        break;
    }
  }
}
