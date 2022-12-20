import { NgModule } from '@angular/core';
import { AuthErrorMessagePipe } from '@pipes/auth-error-message/auth-error-message.pipe';
import { DisplayItemFromListPipe } from '@pipes/display-item-from-list/display-item-from-list.pipe';
import { DisplayItemsFromListPipe } from '@pipes/display-items-from-list/display-items-from-list.pipe';
import { ErrorMessagePipe } from '@pipes/error-message/error-message.pipe';
import { StringUnderscoreToSpaceTitleCasePipe } from '@pipes/string-underscore-to-space-titlecase/string-underscore-to-space-titlecase.pipe';
import { UomToSymbolPipe } from '@pipes/uom-to-symbol/uom-to-symbol.pipe';
import { DateAgoPipe } from '@pipes/date-ago/date-ago.pipe';
import { AbbreviateNumberPipe } from '@pipes/abbreviate-number/abbreviate-number.pipe';
import { ShortGuidPipe } from './short-guid/short-guid.pipe';
import { TransportTermsToDescriptionPipe } from './transport-terms-to-description/transport-terms-to-description.pipe';
import { BooleanYesNoPipe } from '@pipes/boolean-yes-no/boolean-yes-no.pipe';

const PIPES = [
  StringUnderscoreToSpaceTitleCasePipe,
  UomToSymbolPipe,
  DateAgoPipe,
  AbbreviateNumberPipe,
  ShortGuidPipe,
  TransportTermsToDescriptionPipe,
  BooleanYesNoPipe,
  DisplayItemFromListPipe,
  ErrorMessagePipe,
  DisplayItemsFromListPipe,
  AuthErrorMessagePipe
];

@NgModule({
  declarations: [...PIPES],
  exports: [...PIPES]
})
export class PipesModule {}
