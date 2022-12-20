import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationHelperService {
  constructor(private snackBar: MatSnackBar) {}

  public showValidation(msg: string, config?: any): void {
    this.snackBar.open(
      msg,
      'Error',
      config || {
        duration: 4000,
        verticalPosition: 'top',
        horizontalPosition: 'end',
        panelClass: ['snack-bar-warning']
      }
    );
  }

  public showSuccess(msg: string, config?: any): void {
    this.snackBar.open(
      msg,
      undefined,
      config || {
        duration: 4000,
        verticalPosition: 'top',
        horizontalPosition: 'end',
        extraClasses: ['snack-bar-success']
      }
    );
  }
}
