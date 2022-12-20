import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, ErrorHandler, NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from '@app/app-routing.module';
import { AppComponent } from '@app/app.component';
import { ConstantDataHelperService } from '@services/helpers/constant-data-helper/constant-data-helper.service';
import { WINDOW_PROVIDERS } from '@services/helpers/window/window.service';
import { HttpClientModule } from '@angular/common/http';
import { ErrorHandlerService } from '@services/helpers/error-handler/error-handler.service';
import { DataLayerModule } from '@services/data-layer/data-layer.module';
import { AppLayerModule } from '@services/app-layer/app-layer.module';
import { MaterialCssVarsModule } from 'angular-material-css-vars';
import { MainModule } from '@views/main/main.module';
import { DxDataGridModule } from 'devextreme-angular';
import dxDataGrid from 'devextreme/ui/data_grid';
import { CurrencyMaskInputMode, NgxCurrencyModule } from 'ngx-currency';
import { QuicklinkModule } from 'ngx-quicklink';
import { LayoutsModule } from './layouts/layouts.module';
import { MatSnackBarModule } from '@angular/material/snack-bar';

export function constantDataResolveFactory(provider: ConstantDataHelperService) {
  return () => provider.load();
}

dxDataGrid.defaultOptions({
  options: {
    columnChooser: {
      sortOrder: 'asc'
    }
  }
});

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    AppRoutingModule,
    LayoutsModule,
    HttpClientModule,
    DataLayerModule,
    AppLayerModule,
    MainModule,
    MatDialogModule,
    MatSnackBarModule,
    MatAutocompleteModule,
    MatSelectModule,
    DxDataGridModule,
    MaterialCssVarsModule.forRoot({
      isAutoContrast: true,
      darkThemeClass: 'isDarkTheme',
      lightThemeClass: 'isLightTheme'
    }),
    MatDatepickerModule,
    MatNativeDateModule,
    NgxCurrencyModule.forRoot({
      align: 'right',
      allowNegative: true,
      allowZero: false,
      decimal: '.',
      precision: 2,
      prefix: '',
      suffix: '',
      thousands: ',',
      nullable: true,
      inputMode: CurrencyMaskInputMode.NATURAL
    }),
    QuicklinkModule
  ],
  declarations: [AppComponent],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: constantDataResolveFactory,
      deps: [ConstantDataHelperService],
      multi: true
    },
    WINDOW_PROVIDERS,
    { provide: ErrorHandler, useClass: ErrorHandlerService }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
