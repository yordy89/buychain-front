import { Component, Input, OnDestroy } from '@angular/core';
import { first } from 'rxjs/operators';
import { MilestoneEntity } from '@services/app-layer/entities/transaction';
import { MilestoneService } from '@services/app-layer/milestone/milestone.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-accounting-milestones',
  templateUrl: './accounting-milestones.component.html',
  styleUrls: ['./accounting-milestones.component.scss']
})
export class AccountingMilestonesComponent implements OnDestroy {
  @Input() milestones: MilestoneEntity[];

  private destroy$ = new Subject<void>();

  constructor(private milestoneService: MilestoneService) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public downloadDocument(milestone: MilestoneEntity): void {
    if (milestone.attachment) {
      this.milestoneService
        .getDocumentUrl(milestone.attachment.key)
        .pipe(first())
        .subscribe(url => {
          window.open(url, '_blank');
        });
    }
  }
}
