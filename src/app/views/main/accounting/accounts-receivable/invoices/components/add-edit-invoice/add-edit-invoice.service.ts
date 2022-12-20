import { Injectable } from '@angular/core';
import {
  ARInvoicePaymentStateEnum,
  ARInvoiceReviewStateEnum,
  ARInvoiceStateEnum
} from '@services/app-layer/app-layer.enums';
import { ARInvoice } from '@services/app-layer/entities/accounts-receivable';

@Injectable({
  providedIn: 'root'
})
export class AddEditInvoiceService {
  private validateInvoiceCanBeCLOSED(invoice: ARInvoice) {
    const paymentStates = [ARInvoicePaymentStateEnum.RECEIVED, ARInvoicePaymentStateEnum.DEPOSITED];
    if (!invoice.isApproved) {
      return "Can't close an invoice that it is not APPROVED.";
    }
    if (!invoice.isIssued) {
      return `Can't close the invoice from the state ${invoice.state}.`;
    }
    if (!invoice.isPaid) {
      return "Can't close an invoice that is not PAID.";
    }
    if (invoice.payments.some(p => paymentStates.includes(p.state))) {
      return `Can't close an invoice with payments in ${paymentStates.join(' or ')} state.`;
    }
    if (invoice.payments.every(p => p.isVoided)) {
      return "Can't close an invoice with all payments in VOIDED state.";
    }
  }

  private validateInvoiceCanBeISSUED(invoice: ARInvoice) {
    if (!invoice.isDraft) {
      return `Can't issue the invoice from the state ${invoice.state}.`;
    }
    if (!invoice.isApproved) {
      return `Can only issue an invoice from the ${ARInvoiceReviewStateEnum.APPROVED} review state.`;
    }
    if (!invoice?.lineItems?.length) {
      return 'Invoice must have at least one line item.';
    }
  }

  private validateInvoiceCanBeVOIDED(invoice: ARInvoice) {
    if (!invoice.isApproved) {
      return `Can only VOID an invoice from the ${ARInvoiceReviewStateEnum.APPROVED} review state.`;
    }
    if (!invoice.isIssued) {
      return `Can't VOID an invoice from the state ${invoice.state}.`;
    }
    if (invoice.payments.some(p => !p.isVoided)) {
      return "Can't VOID an invoice with non VOID payments.";
    }
  }

  private validateInvoiceCanBeCLOSEDWRITEOFF(invoice: ARInvoice) {
    if (!invoice.isIssued) {
      return `Can't close write off the invoice from the state ${invoice.state}.`;
    }
  }

  validateInvoiceState(state: ARInvoiceStateEnum, invoice: ARInvoice) {
    switch (state) {
      case ARInvoiceStateEnum.CLOSED: {
        return this.validateInvoiceCanBeCLOSED(invoice);
      }
      case ARInvoiceStateEnum.ISSUED: {
        return this.validateInvoiceCanBeISSUED(invoice);
      }
      case ARInvoiceStateEnum.VOIDED: {
        return this.validateInvoiceCanBeVOIDED(invoice);
      }
      case ARInvoiceStateEnum.CLOSED_WRITE_OFF: {
        return this.validateInvoiceCanBeCLOSEDWRITEOFF(invoice);
      }
      default:
        return `Can't set the invoice state to ${state}.`;
    }
  }
}
