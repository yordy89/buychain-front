import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  LOCALE_ID,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ARCreditMemo } from '@services/app-layer/entities/accounts-receivable';
import { CrmAccountEntity } from '@services/app-layer/entities/crm';
import { Subject } from 'rxjs';
import { CreditMemosService } from '@views/main/accounting/accounts-receivable/credit-memos/credit-memos.service';

@Component({
  selector: 'app-view-credit-memo',
  templateUrl: 'view-credit-memo.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViewCreditMemoComponent implements OnInit, OnDestroy {
  @Input() data: ARCreditMemo;
  @Input() crmAccounts: CrmAccountEntity[] = [];

  permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false };

  readonly entryUrl = location.href;

  private destroy$ = new Subject<void>();

  constructor(
    @Inject(LOCALE_ID) private localeId: string,
    private cd: ChangeDetectorRef,
    private creditMemosService: CreditMemosService
  ) {}

  ngOnInit() {
    this.permissions = this.creditMemosService.getPermissions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
