import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges
} from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { TableAction } from '@app/models';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface MenuItem {
  label: string;
  value: number;
  icon: string;
  item: TableAction;
  disabled: boolean;
  hidden: boolean;
  color: ThemePalette;
  labelClasses: string[];
}

@Component({
  selector: 'app-table-actions',
  templateUrl: 'table-actions.component.html',
  styleUrls: ['./table-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableActionsComponent implements OnChanges, OnDestroy {
  @Input() disabled = false;
  @Input() data = null;
  @Input() actions: TableAction[] = [];
  @Output() action = new EventEmitter<number>();
  menuItems: MenuItem[] = [];

  private destroy$ = new Subject<void>();

  constructor(private dialog: MatDialog) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges({ actions }: SimpleChanges): void {
    if (actions && actions.currentValue !== actions.previousValue) {
      this.menuItems = this.actionsMenuItems(this.actions);
    }
  }

  actionsMenuItems(actions: TableAction[]): MenuItem[] {
    return actions
      .map(action => ({
        label: action.label,
        value: action.value,
        icon: action.icon,
        item: action,
        labelClasses: action.labelClasses || [],
        disabled: this.isActionDisabled(action),
        hidden: this.isActionHidden(action),
        color: this.getColor(action)
      }))
      .filter(item => !item.hidden);
  }

  onMenuOpened(event) {
    event.stopPropagation();
  }

  onActionClick(event: MouseEvent, action: TableAction) {
    if (!action.prompt) {
      return this.action.emit(action.value);
    }

    let title: any = action.prompt.title;
    if (typeof title === 'function') {
      title = title(action, this.data);
    }
    let text: any = action.prompt.text;
    if (typeof text === 'function') {
      text = text(action, this.data);
    }

    this.dialog
      .open(DialogModalComponent, {
        width: '450px',
        disableClose: true,
        data: {
          type: DialogType.Confirm,
          title,
          content: text
        }
      })
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(confirmed => {
        if (confirmed) {
          this.action.emit(action.value);
        }
      });
  }

  private isActionDisabled(action: TableAction): boolean {
    let isDisabled = action.isDisabled || false;
    if (typeof isDisabled === 'function') {
      isDisabled = isDisabled(action, this.data);
    }

    return isDisabled;
  }

  private isActionHidden(action: TableAction): boolean {
    let isHidden: any = action.isHidden || false;
    if (typeof isHidden === 'function') {
      isHidden = isHidden(action, this.data);
    }

    return isHidden;
  }

  private getColor(action: TableAction): ThemePalette {
    let color: any = action.color || 'primary';

    if (typeof color === 'function') {
      color = color(action, this.data);
    }

    return color;
  }
}
