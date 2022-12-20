import { Pipe, PipeTransform } from '@angular/core';
import { TransportTermEnum } from '@app/services/app-layer/app-layer.enums';

@Pipe({
  name: 'transportTermsToDescription'
})
export class TransportTermsToDescriptionPipe implements PipeTransform {
  transform(value: TransportTermEnum): any {
    switch (value) {
      case TransportTermEnum.FOB_DEST_COLLECT:
        return 'FOB Destination, freight collect';
      case TransportTermEnum.FOB_DEST_PREPAY:
        return 'FOB Destination, freight prepaid';
      case TransportTermEnum.FOB_DEST_PREPAY_CHARGE:
        return 'FOB Destination, freight prepaid and charge back';
      case TransportTermEnum.FOB_ORIGIN_COLLECT:
        return 'FOB Origin, freight collect';
      case TransportTermEnum.FOB_ORIGIN_PREPAY:
        return 'FOB Origin, freight prepaid';
      case TransportTermEnum.FOB_ORIGIN_PREPAY_CHARGE:
        return 'FOB Origin, freight prepaid and charge back';
      default:
        return '';
    }
  }
}
