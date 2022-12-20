import { Injectable } from '@angular/core';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { Utils } from '@app/services/helpers/utils/utils';

export enum SpecNodeType {
  Option,
  Property,
  Leaf
}

export class SpecSelectionNode {
  public id: string;
  public displayName: string;
  public value: string | number;
  public type: SpecNodeType;
  public uom: string;
  public shorthandTemplate: string;
  public innerSpecs: Array<SpecSelectionNode>;
  public selected: SpecSelectionNode;

  constructor(
    id: string,
    displayName: string,
    type: SpecNodeType,
    innerSpecs: Array<SpecSelectionNode> = [],
    shorthandTemplate = '',
    uom = ''
  ) {
    this.id = id;
    this.displayName = displayName;
    this.value = uom ? id : displayName;
    this.type = type;

    if (innerSpecs[0] instanceof SpecSelectionNode) {
      this.innerSpecs = innerSpecs;
    } else {
      this.innerSpecs = innerSpecs.map(specs => {
        const { id, displayName, type, innerSpecs, shorthandTemplate, uom } = specs;
        return new SpecSelectionNode(id, displayName, type, innerSpecs, shorthandTemplate, uom);
      });
    }

    this.shorthandTemplate = shorthandTemplate;
    this.uom = uom;
  }

  public isComplete() {
    if (this.selected && this.selected.type === SpecNodeType.Leaf) {
      return true;
    }

    if (this.selected && this.selected.type === SpecNodeType.Option) {
      return this.selected.isComplete();
    }

    if (this.innerSpecs && this.innerSpecs.length && this.innerSpecs[0].type === SpecNodeType.Property) {
      return this.innerSpecs.every(x => x.isComplete());
    }

    return !!(this.innerSpecs && !this.innerSpecs.length);
  }

  public resetSelections() {
    this.innerSpecs.forEach(x => x.resetSelections());
    this.selected = null;
  }

  public accumulateSelections(accumulator: any = {}) {
    if (this.selected && this.selected.type === SpecNodeType.Leaf) {
      if (this.selected.uom) {
        accumulator[this.id] = {
          uom: this.selected.uom,
          value: this.selected.value,
          name: this.selected.displayName
        };
      } else {
        accumulator[this.id] = this.selected.value;
      }
    }

    if (this.selected && this.selected.type === SpecNodeType.Option) {
      accumulator[this.id] = this.selected.value;
      this.selected.accumulateSelections(accumulator);
    }

    if (this.selected && this.selected.type === SpecNodeType.Property) {
      this.innerSpecs.forEach(node => node.accumulateSelections(accumulator));
    }

    return accumulator;
  }
}

@Injectable({
  providedIn: 'root'
})
export class SpecService {
  transformToSpecSelectionTree(spec, key = '', name = '', uom = ''): SpecSelectionNode {
    const id = key || this.observeKey(spec);
    const type = this.determineType(spec);
    const displayName = name ? name : type === SpecNodeType.Property ? Utils.camelCaseToTitleCase(id) : id;

    const shorthandTemplate = spec.shorthandTemplate;
    let innerSpecs: SpecSelectionNode[] = [];

    if (type === SpecNodeType.Option) {
      this.populateInnerSpecForOption(spec, innerSpecs);
    } else if (type === SpecNodeType.Property) {
      if (spec instanceof Array) {
        innerSpecs = spec.map(item => this.transformToSpecSelectionTree(item));
      } else if (typeof spec === 'object' && spec.uom) {
        innerSpecs = spec.values.map(item => this.transformToSpecSelectionTree(item, item.value, item.name, spec.uom));
      }
    }

    const specModel = new SpecSelectionNode(id, displayName, type, innerSpecs, shorthandTemplate, uom);

    // select the Option/Property if it's only way to go
    if (innerSpecs.length === 1 && innerSpecs[0].type !== SpecNodeType.Leaf) {
      specModel.selected = innerSpecs[0];
    }

    return specModel;
  }

  private populateInnerSpecForOption(spec, innerSpecs) {
    Object.keys(spec).forEach(objKey => {
      const value = spec[objKey];

      if ((value instanceof Array && typeof value !== 'string') || (typeof value === 'object' && value.uom)) {
        innerSpecs.push(this.transformToSpecSelectionTree(value, objKey));
      }
    });
  }

  private observeKey(spec): string {
    let result = '';

    if (TypeCheck.isObject(spec) && spec.name) {
      result = spec.name;
    } else if (TypeCheck.isString(spec) || TypeCheck.isNumber(spec)) {
      result = spec.toString();
    } else {
      throw new Error(`Spec node is malformed, can't read name of spec. ${spec}`);
    }

    return result;
  }

  private determineType(spec): SpecNodeType {
    let result: SpecNodeType;

    if (typeof spec === 'string' || typeof spec === 'number' || (typeof spec === 'object' && spec.value && spec.name)) {
      result = SpecNodeType.Leaf;
    } else if ((spec instanceof Array && typeof spec !== 'string') || (typeof spec === 'object' && spec.uom)) {
      result = SpecNodeType.Property;
    } else if (typeof spec === 'object' && spec !== null) {
      result = SpecNodeType.Option;
    } else {
      throw new Error("Spec node is malformed, can't determine type.");
    }

    return result;
  }
}
