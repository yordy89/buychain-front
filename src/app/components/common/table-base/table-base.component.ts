import { Component, HostBinding, Input } from '@angular/core';

@Component({
  selector: 'app-table-base',
  templateUrl: './table-base.component.html',
  styleUrls: ['./table-base.component.scss']
})
export class TableBaseComponent {
  @Input() headingText = '';
  @Input() maxBodyHeight = '250px';
  @Input() minWidth = '0px';
  @HostBinding('class.table-base') readonly hostClass = true;
  @Input() @HostBinding('class.disabled-hover') disableHover = false;
}
