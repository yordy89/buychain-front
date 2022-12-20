import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-header-with-number',
  templateUrl: './header-with-number.component.html',
  styleUrls: ['./header-with-number.component.scss']
})
export class HeaderWithNumberComponent {
  @Input() header: string;
  @Input() number: string;
}
