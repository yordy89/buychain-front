import { Injectable } from '@angular/core';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { exportDataGrid } from 'devextreme/excel_exporter';
import cBox from 'devextreme/ui/check_box';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { debounceTime, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GridHelperService {
  disableCheckboxes(e: any, conditionCb: (status: any) => boolean) {
    if (!e || !e.data) {
      return;
    }

    if (e.rowType === 'data' && e.column.command === 'select' && conditionCb(e.data)) {
      const instance = cBox.getInstance(e.cellElement.querySelector('.dx-select-checkbox'));
      instance.option('disabled', true);
      e.cellElement.style.pointerEvents = 'none';
    }
  }

  toggleCheckboxModeOnCondition(e: any, conditionCb: (status: any) => boolean) {
    if (!e || !e.data) return;

    if (e.rowType === 'data' && e.column.command === 'select') {
      const instance = cBox.getInstance(e.cellElement.querySelector('.dx-select-checkbox'));
      if (conditionCb(e.data)) {
        instance.option('disabled', true);
        e.cellElement.style.pointerEvents = 'none';
      } else {
        instance.option('disabled', false);
        e.cellElement.style.pointerEvents = 'auto';
      }
    }
  }

  collapseAllMasterRows(grid) {
    if (grid.masterDetail.enabled) {
      grid.instance.collapseAll(-1);
    }
  }

  expandAllMasterRows(grid) {
    if (grid.masterDetail.enabled) {
      grid.instance.expandAll(-1);
    }
  }

  prepareToolbarCollapseExpand(e, getGridFunc, collapseCb?, expandCb?) {
    let rowPreparedSubs;

    e.toolbarOptions.items.forEach(item => {
      if (item.name !== 'groupPanel') {
        item.locateInMenu = 'auto';
      }
    });

    e.toolbarOptions.items.unshift(
      {
        showText: 'inMenu',
        locateInMenu: 'auto',
        location: 'after',
        widget: 'dxButton',
        options: {
          text: 'Collapse All',
          icon: 'collapse',
          hint: 'Collapse All',
          onClick: () => {
            getGridFunc().instance.collapseAll();
            this.collapseAllMasterRows(getGridFunc());

            if (rowPreparedSubs) {
              rowPreparedSubs.unsubscribe();
            }

            rowPreparedSubs = getGridFunc()
              .onRowPrepared.pipe(debounceTime(50), first())
              .subscribe(() => {
                getGridFunc().instance.repaint();

                if (collapseCb) {
                  collapseCb();
                }
              });
          }
        }
      },
      {
        showText: 'inMenu',
        locateInMenu: 'auto',
        location: 'after',
        widget: 'dxButton',
        options: {
          text: 'Expand All',
          icon: 'expand',
          hint: 'Expand All',
          onClick: () => {
            getGridFunc().instance.expandAll();
            this.expandAllMasterRows(getGridFunc());

            if (rowPreparedSubs) {
              rowPreparedSubs.unsubscribe();
            }

            rowPreparedSubs = getGridFunc()
              .onRowPrepared.pipe(debounceTime(50), first())
              .subscribe(() => {
                getGridFunc().instance.repaint();

                if (expandCb) {
                  expandCb();
                }
              });
          }
        }
      }
    );
  }

  prepareToolbarPrefixTemplate(e) {
    e.toolbarOptions.items.unshift({
      location: 'before',
      template: 'toolbarPrefixTemplate'
    });
  }

  prepareToolbarChartIcon(e, clickCb, disabled?) {
    e.toolbarOptions.items.unshift({
      showText: 'inMenu',
      locateInMenu: 'auto',
      location: 'after',
      widget: 'dxButton',
      get disabled() {
        if (disabled) {
          return disabled();
        }
        return false;
      },
      options: {
        text: 'Chart',
        icon: 'chart',
        hint: 'Chart',
        onClick: () => {
          if (clickCb) {
            clickCb();
          }
        }
      }
    });
  }

  expandingRow(viewState, event) {
    const row = event.key;
    if (!viewState.expandedRows) {
      viewState.expandedRows = [];
    }

    const filteredArr = viewState.expandedRows.filter(item => {
      if (item.length < row.length) {
        return !item.every((key, index) => key === row[index]);
      }

      return true;
    });

    if (filteredArr.length !== viewState.expandedRows.length) {
      viewState.expandedRows = filteredArr;
    }

    if (viewState.expandedRows.some(item => ObjectUtil.isDeepEquals(item, row))) {
      return;
    }

    viewState.expandedRows.push(row);
  }

  collapsingRow(viewState, event) {
    const row = event.key.slice(0, -1);

    if (!viewState.expandedRows?.length) {
      return;
    }

    viewState.expandedRows = viewState.expandedRows.map(item => {
      if (row.length <= item.length && row.every((key, index) => key === item[index])) {
        return row;
      }

      return item;
    });
  }

  handleExpandedRows(viewState, event) {
    if (!viewState.expandedRows?.length) {
      return;
    }

    viewState.expandedRows.forEach(items => {
      const index = 0;
      this.expandRow(event, items, index);
    });
  }

  getAllExpandedRows(productGrid) {
    const items = productGrid.instance.getDataSource().items();
    const res = [];

    const addItems = (item, row) => {
      if (!item.items?.length || !item.items[0].key) {
        res.push(row.concat(item.key));
        return;
      }

      row = row.concat(item.key);

      item.items.forEach(el => addItems(el, row));
    };

    items.forEach(item => addItems(item, []));

    return res;
  }

  exportToExcel(e, fileName: string, customizeCell?) {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet();

    exportDataGrid({
      component: e.component,
      worksheet: worksheet,
      customizeCell: options => {
        const { gridCell, excelCell } = options;

        if (customizeCell) {
          customizeCell(gridCell, excelCell);
        }
      }
    })
      .then(() => workbook.xlsx.writeBuffer())
      .then((buffer: BlobPart) => {
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        saveAs(blob, `${fileName}.xlsx`);
      });

    e.cancel = true;
  }

  private expandRow(event, items, index) {
    let rowKey = items.slice(items, index + 1);

    if (
      (TypeCheck.isObject(rowKey) && !TypeCheck.isArray(rowKey)) ||
      event.component.isRowExpanded(items) ||
      event.component.getRowIndexByKey(rowKey) === -1
    ) {
      return;
    }

    if (event.component.isRowExpanded(rowKey)) {
      while (event.component.isRowExpanded(rowKey)) {
        index++;
        rowKey = items.slice(items, index + 1);
      }

      if (!(index in items)) {
        return;
      }

      return this.expandRow(event, items, index);
    }

    return event.component.expandRow(rowKey).then(() => {
      index++;
      if (index in items) {
        return this.expandRow(event, items, index);
      }
    });
  }
}
