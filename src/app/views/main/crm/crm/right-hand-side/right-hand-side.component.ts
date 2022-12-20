import { Component, Input } from '@angular/core';
import { CrmAccountEntity, CrmContactEntity, CrmLocationEntity } from '@services/app-layer/entities/crm';

@Component({
  selector: 'app-right-hand-side',
  templateUrl: './right-hand-side.component.html'
})
export class RightHandSideComponent {
  @Input() crmAccountData: CrmAccountEntity;
  @Input() crmContactData: CrmContactEntity;
  @Input() crmLocationData: CrmLocationEntity;
  @Input() visibleTab: 'Account' | 'Contact' | 'Location';
}
