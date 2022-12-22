import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NotificationHelperService } from '@services/helpers/notification-helper/notification-helper.service';
import { BuychainLibHelper } from '@services/helpers/utils/buychain-lib-helper';
import { FormGroupHelper } from '@services/helpers/utils/form-group-helper';
import { TransactionsService } from '@services/app-layer/transactions/transactions.service';
import { ProductEntity } from '@services/app-layer/entities/inventory-search';
import { combineLatest, EMPTY } from 'rxjs';
import { catchError, first } from 'rxjs/operators';
import { Environment } from '@services/app-layer/app-layer.environment';

@Component({
  selector: 'app-add-tally-unit-modal',
  templateUrl: './add-tally-unit-modal.component.html',
  styleUrls: ['./add-tally-unit-modal.component.scss']
})
export class AddTallyUnitModalComponent implements OnInit {
  public form: FormGroup;
  public units: FormControl;
  public maxAvailableUnitCount;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { transaction: any; availableProductsList: ProductEntity[] },
    // transaction, not always the complete info, but needs to have tallyEntity, isSeller, id;
    private dialogRef: MatDialogRef<AddTallyUnitModalComponent>,
    private transactionsService: TransactionsService,
    private notificationHelperService: NotificationHelperService
  ) {
    this.maxAvailableUnitCount = this.data.availableProductsList.length;
  }

  ngOnInit() {
    this.createFormControls();
    this.createForm();
  }

  public addLotToTransaction(): void {
    if (this.form.invalid) {
      FormGroupHelper.markTouchedAndDirty(this.form);
      return;
    }

    let products: ProductEntity[];
    if (this.data.transaction.isSales) {
      const selectionCriteria = Environment.getCurrentCompany().salesPractices.selectionCriteria;
      const sortedProducts: ProductEntity[] = BuychainLibHelper.sortBasedOnSelectionCriteria();
      products = sortedProducts.slice(0, this.units.value);
    } else {
      // in case of purchase add some selection criteria
      products = this.data.availableProductsList.slice(0, this.units.value);
    }

    const load = products.map(p =>
      this.transactionsService.addTransactionTallyUnit(this.data.transaction.id, {
        product: p.id,
        offer: p.salesData.priceOfMerit
      })
    );

    combineLatest(load)
      .pipe(
        first(),
        catchError(() => {
          this.notificationHelperService.showValidation(
            'Something unexpected happened. Please reload the page and try again.'
          );
          return EMPTY;
        })
      )
      .subscribe(() => {
        this.notificationHelperService.showSuccess('The lot is successfully added.');
        this.close(true);
      });
  }

  public close(added: boolean): void {
    this.dialogRef.close(added);
  }

  private createFormControls(): void {
    this.units = new FormControl('', [
      Validators.required,
      Validators.min(1),
      Validators.max(this.maxAvailableUnitCount)
    ]);
  }
  private createForm(): void {
    this.form = new FormGroup({
      units: this.units
    });
  }
}
