import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-personnel-table',
  templateUrl: './loading-personnel-table.component.html',
  styleUrls: ['./loading-personnel-table.component.scss']
})
export class LoadingPersonnelTableComponent {
  @Input() personnelList: any[];
}
