import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TableAction } from '@app/models';
import { DimensionsService } from '@services/app-layer/dimensions/dimensions.service';
import { DimensionEntity } from '@services/app-layer/entities/dimension';
import { GridHelperService } from '@services/helpers/grid-helper/grid-helper.service';
import { AddEditDimensionModalComponent } from '@views/main/accounting/financial/dimensions/add-edit-dimension-modal/add-edit-dimension-modal.component';
import { DxDataGridComponent } from 'devextreme-angular';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { first, takeUntil } from 'rxjs/operators';
import { NavigationHelperService } from '@services/helpers/navigation-helper/navigation-helper.service';
import { Environment } from '@services/app-layer/app-layer.environment';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';

enum Actions {
  EDIT,
  DELETE,
  CHANGE_STATUS
}

@Component({
  selector: 'app-dimensions',
  templateUrl: './dimensions.component.html'
})
export class DimensionsComponent implements OnInit, OnDestroy {
  @ViewChild('dimensionsGrid') dimensionsGrid: DxDataGridComponent;
  public gridFilterValue = ['status', '<>', ''];

  public permissions = { canRead: false, canCreate: false, canUpdate: false, canDelete: false };

  private offset = 0;
  private limit = 1000;
  public allLoaded = false;

  public dimensionsList: DimensionEntity[] = [];

  actions: TableAction[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private navigationHelperService: NavigationHelperService,
    private dimensionsService: DimensionsService,
    private dialog: MatDialog,
    private gridHelperService: GridHelperService
  ) {}

  ngOnInit(): void {
    if (!Environment.getCurrentCompany().features.accounting) {
      this.navigationHelperService.navigateUserHome();
    }
    this.setPermissions();

    if (this.permissions.canRead) {
      this.initTableActions();
      this.loadDimensions();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onAction(value: Actions, dimension: DimensionEntity) {
    switch (value) {
      case Actions.EDIT:
        this.editDimension(dimension);
        break;

      case Actions.DELETE:
        this.deleteDimension(dimension);
        break;

      case Actions.CHANGE_STATUS:
        this.toggleStatus(dimension);
        break;
    }
  }

  addDimension(): void {
    this.dialog
      .open(AddEditDimensionModalComponent, {
        width: '648px',
        disableClose: true
      })
      .afterClosed()
      .pipe(first())
      .subscribe(addedDimension => {
        if (addedDimension) {
          this.dimensionsList.push(addedDimension);
        }
      });
  }

  deleteDimension(dimension: DimensionEntity): void {
    this.dimensionsService.deleteDimension(dimension.id).subscribe(() => {
      const index = this.dimensionsList.findIndex(item => item.id === dimension.id);

      if (index === -1) return;

      this.dimensionsList = this.dimensionsList.filter(item => item.id !== dimension.id);
      this.offset--;
    });
  }

  editDimension(dimension: DimensionEntity): void {
    this.dialog
      .open(AddEditDimensionModalComponent, {
        width: '648px',
        disableClose: true,
        data: dimension
      })
      .afterClosed()
      .pipe(first())
      .subscribe(data => {
        if (data) {
          this.dimensionsList = this.dimensionsList.map(item => (item.id === data.id ? data : item));
        }
      });
  }
  toggleStatus(dimension: DimensionEntity): void {
    this.dimensionsService
      .editDimension(dimension, { archived: !dimension.archived })
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        this.dimensionsList = this.dimensionsList.map(item => (item.id === data.id ? data : item));
      });
  }

  onToolbarPreparing(e) {
    this.gridHelperService.prepareToolbarCollapseExpand(e, () => this.dimensionsGrid);
    this.gridHelperService.prepareToolbarPrefixTemplate(e);
  }

  showInactiveSwitch(e): void {
    this.gridFilterValue = e.checked ? ['status', '<>', ''] : ['status', '=', 'Active'];
  }

  loadDimensions(): void {
    this.dimensionsService
      .getDimensions(this.limit, this.offset)
      .pipe(takeUntil(this.destroy$))
      .subscribe(dimensions => {
        this.allLoaded = dimensions.length < this.limit;
        this.offset += this.limit;
        this.dimensionsList.push(...dimensions.filter(item => !this.dimensionsList.some(c => c.id === item.id)));
      });
  }
  /*
   * private helpers
   * */

  private setPermissions(): void {
    const dimensionPermissions =
      Environment.getCurrentUser().normalizedAccessControlRoles?.DIMENSION?.dimensionSection?.sectionGroup;
    this.permissions.canRead = dimensionPermissions?.read.value === AccessControlScope.Company;
    this.permissions.canCreate = dimensionPermissions?.create.value === AccessControlScope.Company;
    this.permissions.canUpdate = dimensionPermissions?.update.value === AccessControlScope.Company;
    this.permissions.canDelete = dimensionPermissions?.delete.value === AccessControlScope.Company;
  }

  private initTableActions() {
    this.actions = [
      {
        label: 'Edit',
        icon: 'edit',
        value: Actions.EDIT,
        isHidden: !this.permissions.canUpdate
      },
      {
        label: 'Delete',
        icon: 'delete',
        color: 'warn',
        value: Actions.DELETE,
        prompt: {
          title: 'Confirm please!',
          text: 'Are you sure you want to delete the Dimension?'
        },
        isHidden: !this.permissions.canDelete
      },
      {
        label: 'Change Status',
        icon: 'loop',
        value: Actions.CHANGE_STATUS,
        color(action: TableAction, item: DimensionEntity) {
          return item.archived ? 'primary' : 'warn';
        },
        isHidden: !this.permissions.canUpdate
      }
    ];
  }
}
