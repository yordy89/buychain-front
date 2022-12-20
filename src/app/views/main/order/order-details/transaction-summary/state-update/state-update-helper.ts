import { OrderPdfService } from '@views/main/order/order-pdf-templates/order-pdf.service';
import { mergeMap } from 'rxjs/operators';
import { TransactionEntity } from '@services/app-layer/entities/transaction';
import { ReportsService } from '@services/app-layer/reports/reports.service';
import { Injectable } from '@angular/core';
import {
  ProductStateEnum,
  RoleInTransaction,
  TransactionStateEnum,
  TransactionTypeEnum
} from '@services/app-layer/app-layer.enums';
import { ProductsHelper } from '@services/app-layer/products/products-helper';

@Injectable({
  providedIn: 'root'
})
export class StateUpdateHelper {
  constructor(private pdfService: OrderPdfService, private reportsService: ReportsService) {}

  public generateOrderConfirmationPdf(transaction: TransactionEntity) {
    return this.reportsService
      .getOrderConfirmation(transaction.id)
      .pipe(mergeMap(orderConfirmation => this.pdfService.generateOrderConfirmation(orderConfirmation, transaction)));
  }

  public generateInvoicePdf(transaction: TransactionEntity) {
    return this.reportsService
      .getInvoice(transaction.id)
      .pipe(mergeMap(invoice => this.pdfService.generateInvoice(invoice, transaction)));
  }

  public generatePickSheetPdf(transaction: TransactionEntity) {
    return this.reportsService
      .getPickTicket(transaction.id)
      .pipe(mergeMap(pickTicket => this.pdfService.generatePickSheet(pickTicket, transaction)));
  }

  public generateBillOfLadingPdf(transaction: TransactionEntity) {
    return this.reportsService
      .getBillOfLading(transaction.id)
      .pipe(mergeMap(billOfLadingData => this.pdfService.generateBillOfLadingPdf(billOfLadingData, transaction)));
  }

  public hasCompleteInfoForQuote(transactionData: TransactionEntity): boolean {
    const hasShipFrom = transactionData.shipFromName;
    const hasShipTo = transactionData.shipToName;
    const hasSeller = transactionData.sellerName;
    const hasBuyer = transactionData.buyerName;
    const hasTally = transactionData.tally.units.length;
    const hasShippingInfo = !!transactionData.trackingData.selectedTransportMethod;
    const isTallyItemsAvailable = !!transactionData.tallyUnits.length;
    const isTallyItemsRequiredQtyAvailable = transactionData.isTallyItemsRequiredQtyAvailable;
    const noDeletedProducts = transactionData.tally.deletedProducts.length === 0;

    return (
      hasShipFrom &&
      hasShipTo &&
      hasSeller &&
      hasBuyer &&
      hasTally &&
      hasShippingInfo &&
      isTallyItemsAvailable &&
      isTallyItemsRequiredQtyAvailable &&
      noDeletedProducts
    );
  }

  public getDraftStateTooltip(transactionData: TransactionEntity): string {
    const hasShipFrom = transactionData.shipFromName;
    const hasShipTo = transactionData.shipToName;
    const hasSeller = transactionData.sellerName;
    const hasBuyer = transactionData.buyerName;
    const hasShippingInfo = !!transactionData.trackingData.selectedTransportMethod;
    const hasTally = transactionData.tally.units.length;
    const hasDeletedProducts = transactionData.tally.deletedProducts.length > 0;

    if (hasDeletedProducts) return 'Transaction has deleted or sold products in tally. Please remove them to proceed.';
    if (!hasTally) return 'Transaction has no Tally. Please make sure to add tally units to proceed.';
    else if (!transactionData.isTallyItemsRequiredQtyAvailable)
      return 'Transaction has Tally items that requires more units than currently available. Please adjust required units quantity.';
    else if (!hasShipFrom || !hasShipTo || !hasSeller || !hasBuyer || !hasShippingInfo) {
      return 'Shipping information is missing. Please make sure to provide complete shipping information to proceed.';
    }
    return '';
  }

  public hasCompleteInfoForReview(transactionData: TransactionEntity): boolean {
    if (this.tallyHasInvalidShipFrom(transactionData)) return false;
    return this.hasCompleteInfoForQuote(transactionData);
  }

  private tallyHasInvalidShipFrom(transaction: TransactionEntity): boolean {
    if (!transaction.passedTheState(TransactionStateEnum.Quote)) {
      const dataType = transaction.type === TransactionTypeEnum.Purchase ? 'offlineData' : 'onlineData';
      return transaction.tallyUnits?.some(unit => unit.product[dataType]?.shipFromId !== transaction.shipFrom.id);
    }
    return false;
  }

  public getQuoteStateTooltip(transactionData: TransactionEntity): string {
    let quoteStateTooltip = '';

    const sellerData = transactionData.trackingData.sellerData;
    const buyerData = transactionData.trackingData.buyerData;
    const hasDeletedProducts = transactionData.tally.deletedProducts.length > 0;

    if (hasDeletedProducts) return 'Transaction has deleted or sold products in tally. Please remove them to proceed.';
    const crmProvided =
      (transactionData.role === RoleInTransaction.Seller && buyerData.crmData && buyerData.crmData.buyingCompany) ||
      (transactionData.role === RoleInTransaction.Buyer && sellerData.crmData && sellerData.crmData.sellingCompany);

    if (!crmProvided) {
      if (
        transactionData.role === RoleInTransaction.Seller &&
        (!buyerData.crmData || !buyerData.crmData.buyingCompany)
      ) {
        quoteStateTooltip =
          'The CRM information for the buyer is missing. Make sure to link transaction to a CRM unit to continue';
      }
      if (
        transactionData.role === RoleInTransaction.Buyer &&
        (!sellerData.crmData || !sellerData.crmData.sellingCompany)
      ) {
        quoteStateTooltip =
          'The CRM information for the seller is missing. Make sure to link transaction to a CRM unit to continue';
      }
    } else if (!transactionData.isTallyItemsRequiredQtyAvailable) {
      quoteStateTooltip =
        'Transaction has Tally items that requires more units than currently available. Please adjust required units quantity.';
    } else if (this.tallyHasInvalidShipFrom(transactionData)) {
      quoteStateTooltip = 'There is a tally unit with invalid ship from facility.';
    }
    return quoteStateTooltip;
  }

  public getReviewStateTooltip(transactionData: TransactionEntity, hasOutstandingPurchaseContract: boolean): string {
    if (hasOutstandingPurchaseContract) {
      return 'The tally products should not have outstanding purchase contract.';
    }

    return '';
  }

  public getConfirmedStateTooltip(transactionData): string {
    if (transactionData.isSales && this.tallyHasOutstandingProducts(transactionData)) {
      return 'All Product lots in tally should be On Hand';
    }
    if (!this.tallyRLUProductsAreComplete(transactionData)) {
      return 'Random length units details need to be provided.';
    }
    return '';
  }

  public tallyHasOutstandingProducts(transactionData: TransactionEntity): boolean {
    return transactionData.tallyUnits?.some(
      item => item.product.state === ProductStateEnum.ON_ORDER || item.product.state === ProductStateEnum.IN_TRANSIT
    );
  }

  public allTallyProductsAreActive(transactionData: TransactionEntity): boolean {
    return transactionData.tally?.units?.every(
      item =>
        item.product.state === ProductStateEnum.ON_HAND ||
        item.product.state === ProductStateEnum.ON_ORDER ||
        item.product.state === ProductStateEnum.IN_TRANSIT ||
        item.product.state === ProductStateEnum.SOLD // ON_HAND && soldTransactionId - ex - true
    );
  }

  public tallyRLUProductsAreComplete(transactionData: TransactionEntity): boolean {
    const randomProducts = transactionData.tally.units
      .map(u => u.product)
      .filter(p => ProductsHelper.isRandomLengthProduct(p));
    if (!randomProducts.length) return true;
    return !randomProducts.some(p => !p.spec.lengthUnits.length || p.spec.lengthUnits.every(u => u.count === 0));
  }

  public hasAllocatedLotInTally(transactionData: TransactionEntity): boolean {
    return transactionData.tally.units.some(l => l.product.allocatedTransactionId);
  }
}
