import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatFormFieldAppearance } from '@angular/material/form-field';
import { GroupEntity } from '@services/app-layer/entities/group';
import { MatMenuTrigger } from '@angular/material/menu';
import { DxTreeListComponent } from 'devextreme-angular';

@Component({
  selector: 'app-tree-selector',
  templateUrl: './tree-selector.component.html',
  styleUrls: ['./tree-selector.component.scss']
})
export class TreeSelectorComponent implements OnInit, OnChanges {
  @ViewChild(MatMenuTrigger) treeListMenu: MatMenuTrigger;
  @ViewChild(DxTreeListComponent) treeListComp: DxTreeListComponent;
  @ViewChild('inputElem') inputElem: ElementRef;

  @Input() appearance: MatFormFieldAppearance = 'outline';
  @Input() label = '';
  @Input() allowClear = false;
  @Input() placeholder = '';

  @Input() control: FormControl;
  @Input() treeListData: any[] = [];
  @Input() parentExpr: string;
  @Input() keyExpr: string;
  @Input() displayKey: string;
  @Input() nullExpression = '';
  @Input() nullValue = '';
  @Input() showRequiredMarker = false;

  @Output() entered = new EventEmitter();

  selectedRowKeys = [];
  focusedRowIndex = -1;

  private focusedRowData: GroupEntity = null;

  ngOnInit(): void {
    this.label = this.label || this.placeholder;
    this.placeholder = this.placeholder || this.label;
    this.initSelectedRowKeys();
    this.focusedRowIndex = this.selectedRowKeys.length ? -1 : 0;
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.treeListData) {
      this.addNullValueToList();
    }
  }

  getKeyName(value) {
    return value?.[this.keyExpr] || this.nullValue;
  }

  getDisplayName(value) {
    return value?.[this.displayKey] || this.nullExpression;
  }

  getNameById(value) {
    const target = (this.treeListData || []).find(item => this.getKeyName(item) === value);
    return this.getDisplayName(target);
  }

  resetParent(e: Event): void {
    e.stopPropagation();
    this.control.setValue(this.nullValue);
    this.control.markAsDirty();
    this.initSelectedRowKeys();
  }

  onItemSelection(group: GroupEntity): void {
    this.control.setValue(this.getKeyName(group));
    this.control.markAsDirty();
    this.treeListMenu.closeMenu();
    this.initSelectedRowKeys();
  }

  onFocusedRowChanged(event) {
    this.focusedRowData = event.row.data;
  }

  onClosedMenu() {
    this.focusedRowData = null;
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }

  onFocus() {
    this.treeListMenu.openMenu();
    this.treeListComp.instance.focus();
  }

  onKeyDown(event) {
    if (event.event.key === 'Enter' && this.focusedRowData) {
      this.onItemSelection(this.focusedRowData);
      const ev = event.event;
      ev.target = this.inputElem.nativeElement;
      this.entered.emit(ev);
    }
  }

  private addNullValueToList() {
    if (this.nullExpression && !this.treeListData.some(item => item[this.displayKey] === this.nullExpression)) {
      this.treeListData = [{ [this.keyExpr]: this.nullValue, [this.displayKey]: this.nullExpression }].concat(
        this.treeListData
      );
    }
  }

  private initSelectedRowKeys() {
    const target = this.treeListData.find(item => item[this.keyExpr] === this.control.value);
    this.selectedRowKeys = target && this.control.value ? [this.control.value] : [];
  }
}
