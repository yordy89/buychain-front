import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges
} from '@angular/core';
import { ThemePalette } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { TableAction } from '@app/models';
import { FABAction } from '@app/models/fab-action';
import { DialogModalComponent, DialogType } from '@components/common/modals/dialog-modal/dialog-modal.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface MenuItem {
  label: string;
  value: number;
  icon: string;
  item: TableAction;
  hidden: boolean;
  color: ThemePalette;
}

@Component({
  selector: 'app-table-fab',
  templateUrl: 'table-fab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TableFabComponent implements OnChanges, OnDestroy {
  @Input() actions: TableAction[] = [];
  @Input() selectedItems: any[] = [];
  @Output() action = new EventEmitter<number>();
  @HostBinding('class.table-fab') private readonly show = true;

  menuItems: MenuItem[] = [];
  menuOpened = false;

  private destroy$ = new Subject<void>();

  constructor(private dialog: MatDialog) {}

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges({ actions, selectedItems }: SimpleChanges): void {
    if ((actions && actions.currentValue !== actions.previousValue) || selectedItems?.currentValue) {
      this.menuItems = this.actionsMenuItems(this.actions);
    }
  }

  actionsMenuItems(actions: FABAction[]): MenuItem[] {
    return actions
      .map(action => ({
        label: action.label,
        value: action.value,
        icon: action.icon,
        item: action,
        hidden: this.isActionHidden(action),
        color: this.getColor(action)
      }))
      .filter(item => !item.hidden);
  }

  onActionClick(event: MouseEvent, action: FABAction) {
    if (!action.prompt) {
      return this.action.emit(action.value);
    }

    let title: any = action.prompt.title;
    if (typeof title === 'function') {
      title = title(action);
    }
    let text: any = action.prompt.text;
    if (typeof text === 'function') {
      text = text(action);
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

  private isActionHidden(action: FABAction): boolean {
    let isHidden: any = action.isHidden || false;
    if (typeof isHidden === 'function') {
      isHidden = isHidden(action);
    }

    return isHidden;
  }

  private getColor(action: FABAction): ThemePalette {
    let color: any = action.color || 'primary';

    if (typeof color === 'function') {
      color = color(action);
    }

    return color;
  }
}
