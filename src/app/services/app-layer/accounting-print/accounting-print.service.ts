import { Injectable } from '@angular/core';
import { SpinnerHelperService } from '@services/helpers/spinner-helper/spinner-helper.service';
import { SkinService } from '@services/app-layer/skin/skin.service';
import * as html2pdf from 'html2pdf.js';

@Injectable({
  providedIn: 'root'
})
export class AccountingPrintService {
  constructor(private spinnerService: SpinnerHelperService, private skinService: SkinService) {}

  generatePDF(elementId: string, filename: string) {
    const element = document.getElementById(elementId);
    const onePageHeight = Math.ceil(element.clientWidth * 0.707) - 0.5;
    const pagesCount = Math.trunc(element.clientHeight / onePageHeight) + 1;
    const width = element.clientWidth;
    const height = pagesCount * onePageHeight;
    const backgroundColor = this.skinService.isCurrentDark ? '#424242' : 'rgba(230, 235, 243, 10%)';

    const options = {
      filename,
      html2canvas: { backgroundColor, scale: 4, useCORS: true, width, height, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
      pagebreak: { mode: ['css'], before: '.page-break' }
    };

    return html2pdf().set(options).from(element).toPdf().get('pdf');
  }
}
