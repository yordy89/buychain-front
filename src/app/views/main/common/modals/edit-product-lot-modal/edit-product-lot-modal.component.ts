import { Component, Inject, OnDestroy, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { ProductLotDetailsComponent } from '@views/main/common/product-lot-details/product-lot-details.component';

@Component({
  selector: 'app-edit-product-lot-modal',
  templateUrl: './edit-product-lot-modal.component.html'
})
export class EditProductLotModalComponent implements OnDestroy {
  @ViewChild(ProductLotDetailsComponent) productLotDetails: ProductLotDetailsComponent;

  private destroy$ = new Subject<void>();

  constructor(
    private dialogRef: MatDialogRef<EditProductLotModalComponent>,
    @Inject(MAT_DIALOG_DATA) public lotId: string
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.unsubscribe();
  }

  public close(): void {
    this.dialogRef.close(this.productLotDetails.isChanged);
  }
}
