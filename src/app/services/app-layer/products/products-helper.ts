import { Environment } from '@app/services/app-layer/app-layer.environment';
import { BuychainLibHelper } from '@services/helpers/utils/buychain-lib-helper';
import { TypeCheck } from '@services/helpers/utils/type-check';
import { differenceInDays, isValid } from 'date-fns';
import { AccessControlScope } from '../../app-layer/permission/permission.interface';
import { PriceSystem, ProductLotPermissionEnum } from '@app/services/app-layer/app-layer.enums';
import { Product, ProductSpec } from '@services/data-layer/http-api/base-api/swagger-gen';
import { InventorySearchEntity, ProductEntity } from '@services/app-layer/entities/inventory-search';
import { SpecHelper } from '@services/helpers/utils/spec-helper';
import { ProductSpecExtended } from '@services/app-layer/entities/product';

export interface ProductLotAccessRoles {
  canCreate: boolean;
  canReadOnlyOwn: boolean;
  canReadTheLot: boolean;
  canUpdateOwner: boolean;
  canUpdatePermission: boolean;
  canUpdateSalesNotes: boolean;
  canUpdatePriceOfMerit: boolean;
  canUpdateShipWeekEstimate: boolean;
  canMove: boolean;
}

export class ProductsHelper {
  static calcAvgCostBasisPerUom(spec, costBasisSumOfProducts: number, numberOfProducts: number): number {
    if (numberOfProducts === 0) return 0;
    const unitMeasures = BuychainLibHelper.getUomValue();
    const totalMeasure = numberOfProducts * unitMeasures;
    return costBasisSumOfProducts / totalMeasure;
  }

  static getAskPricePerUnit(product: Product): number {
    return BuychainLibHelper.getAskPrice();
  }

  static getAvgAskPricePerUnit(products: Product[]): number {
    return products?.length
      ? products.reduce((acc, cur) => acc + BuychainLibHelper.getAskPrice(), 0) / products.length
      : 0;
  }

  static getAskPriceTotal(products: Product[]): number {
    return products.reduce((acc, cur) => acc + this.getAskPricePerUnit(cur), 0);
  }

  static calcProfitTotal(products: Product[]) {
    return products.reduce((acc, cur) => acc + BuychainLibHelper.getEstimatedProfit(), 0);
  }

  static sortProductsBySelectionCriteria(products: ProductEntity[]): ProductEntity[] {
    if (!products?.length) return [];
    const selectionCriteria = Environment.getCurrentCompany().salesPractices.selectionCriteria;
    return BuychainLibHelper.sortBasedOnSelectionCriteria();
  }

  static getAveragePurchaseAge(products: ProductEntity[]): number {
    if (!products || !products.length) return 0;

    const now = new Date();
    const agePerItem = products.filter(x => x.purchaseDate).map(x => differenceInDays(now, new Date(x.purchaseDate)));
    return this.calcAvg(agePerItem);
  }

  static getAverageLandedAge(products: ProductEntity[]): number {
    if (!products || !products.length) return 0;

    const now = new Date();
    const agePerItem = products.filter(x => x.landedDate).map(x => differenceInDays(now, new Date(x.landedDate)));
    return this.calcAvg(agePerItem);
  }

  static isRandomLengthProduct(product: ProductEntity): boolean {
    return product.spec.cutType === Environment.randomLengthCutType;
  }

  static getProductLotUnitMeasure(spec: ProductSpec): number {
    if (!spec) return;
    return BuychainLibHelper.getUomValue();
  }

  static getProductLotUnitWeight(spec: ProductSpec): number {
    if (!spec) return;
    return BuychainLibHelper.getUomValue() * 3500;
  }

  static getProductLotMeasuresInUom(spec, productCount) {
    return this.getProductLotUnitMeasure(spec) * productCount;
  }

  static getProductLotMeasuresWithUomLabel(spec, productCount) {
    const measure = this.getProductLotMeasuresInUom(spec, productCount);
    return `${Math.round(measure * 100) / 100} ${this.getMeasureLabel(spec)}`;
  }

  static getMeasureLabel(spec): string {
    const priceSystem = spec && spec.priceSystem;
    switch (priceSystem) {
      case PriceSystem.USD_Board_Feet || 'USD/M-BOARD-FEET':
        return 'MBF';
      case PriceSystem.USD_Linear_Feet || 'USD/LINEAR-FEET':
        return 'LF';
      case PriceSystem.USD_Square_Feet || 'USD/SQUARE-FEET':
        return 'SF';
      default:
        throw new Error(`unexpected price system: ${priceSystem}`);
    }
  }

  static getProductLotAccessRoles(productLot: InventorySearchEntity): ProductLotAccessRoles {
    if (!productLot) throw new Error('argument is required. Name: productLot');

    const currentUser = Environment.getCurrentUser();

    const accessControl = {
      ...currentUser.normalizedAccessControlRoles.PRODUCT.searchSection.sectionGroup,
      ...currentUser.normalizedAccessControlRoles.PRODUCT.updateSection.sectionGroup,
      ...currentUser.normalizedAccessControlRoles.PRODUCT.createSection.sectionGroup
    };

    const lotHasEditableProducts = productLot.products.some(p => !p.isAllocated);

    return {
      canCreate: accessControl.create.value === AccessControlScope.Company,
      canReadOnlyOwn: accessControl.read.value === AccessControlScope.Owner,
      canReadTheLot:
        accessControl.read.value === AccessControlScope.Company ||
        productLot.permission !== ProductLotPermissionEnum.PRIVATE ||
        (accessControl.read.value === AccessControlScope.Owner && currentUser.id === productLot.ownerId),
      canUpdateOwner:
        (accessControl.updateOwner.value === AccessControlScope.Company ||
          (accessControl.updateOwner.value === AccessControlScope.Owner && currentUser.id === productLot.ownerId)) &&
        !productLot.hasAllocatedProducts,
      canUpdatePermission:
        (accessControl.updatePermission.value === AccessControlScope.Company ||
          (accessControl.updatePermission.value === AccessControlScope.Owner &&
            currentUser.id === productLot.ownerId)) &&
        !productLot.hasAllocatedProducts,
      canUpdateSalesNotes:
        (accessControl.updateSalesNotes.value === AccessControlScope.Company ||
          (accessControl.updateSalesNotes.value === AccessControlScope.Owner &&
            currentUser.id === productLot.ownerId)) &&
        !productLot.hasAllocatedProducts,
      canUpdatePriceOfMerit:
        (accessControl.updatePriceOfMerit.value === AccessControlScope.Company ||
          (accessControl.updatePriceOfMerit.value === AccessControlScope.Owner &&
            currentUser.id === productLot.ownerId)) &&
        !productLot.hasAllocatedProducts,
      canUpdateShipWeekEstimate:
        (accessControl.updateShipWeekEstimate.value === AccessControlScope.Company ||
          (accessControl.updateShipWeekEstimate.value === AccessControlScope.Owner &&
            currentUser.id === productLot.ownerId)) &&
        !productLot.hasAllocatedProducts,
      canMove:
        (accessControl.updateLot.value === AccessControlScope.Company ||
          (accessControl.updateLot.value === AccessControlScope.Owner && currentUser.id === productLot.ownerId)) &&
        lotHasEditableProducts
    };
  }

  static canCloseContractForProduct(product: ProductEntity) {
    const currentUser = Environment.getCurrentUser();
    const accessControl = currentUser.normalizedAccessControlRoles.PRODUCT.updateSection.sectionGroup;

    return (
      accessControl.updateContract.value === AccessControlScope.Company ||
      (accessControl.updateContract.value === AccessControlScope.Owner && currentUser.id === product.owner)
    );
  }

  static calcAvg(numbers: number[]) {
    const count = numbers.length;
    if (count === 0) return 0;
    const sum = numbers.reduce((s, current) => (s += current), 0);
    const avgAge = sum / count;
    return Math.round(avgAge);
  }

  static setSpecs(objectToAssign: any, spec: any): void {
    const specObject = {
      productGroupName: spec.productGroupName,
      productName: spec.productName,
      priceSystem: spec.priceSystem,
      unitPieceCount: spec.unitPieceCount
    };

    switch (spec.productGroupName) {
      case 'Lumber':
        this.setSpecsLumber(specObject, spec);
        break;

      case 'Panel':
        this.setSpecPanel(specObject, spec);
        break;

      case 'Engineered':
        this.setSpecEngineered(specObject, spec);
        break;
    }

    Object.assign(objectToAssign, specObject);
  }

  private static setSpecsLumber(specObject, spec) {
    const lumberSpecs = {
      lumberSeasoning: spec.seasoning || spec.seasonings || ' ',
      lumberPattern: spec.pattern || spec.patterns || ' ',
      lumberSpecies: spec.species || ' ',
      lumberSubspecies: spec.subspecies || ' ',
      lumberGrade: spec.grade || spec.grades || ' ',
      lumberSubGrade: spec.subGrade || spec.subGrades || ' ',
      lumberCutType: spec.cutType || spec.cutTypes || ' ',
      lumberThickness: ProductsHelper.getValeFromTargetDimension(spec.thickness),
      lumberThicknessName: spec.thickness ? spec.thickness.name + SpecHelper.getUomSymbol(spec.thickness.uom) : ' ',
      lumberLength: spec.length ? spec.length.name + SpecHelper.getUomSymbol(spec.length.uom) : ' ',
      lumberLengthInInch: ProductsHelper.getValeFromTargetDimension(spec.length),
      lumberWidth: ProductsHelper.getValeFromTargetDimension(spec.width),
      lumberWidthName: spec.width ? spec.width.name + SpecHelper.getUomSymbol(spec.width.uom) : ' ',
      lumberCutGrade: ''
    };
    lumberSpecs.lumberCutGrade = `${lumberSpecs.lumberThickness}x${lumberSpecs.lumberWidth} ${lumberSpecs.lumberGrade}`;

    Object.assign(specObject, lumberSpecs);
  }

  private static setSpecPanel(specObject, spec) {
    const panelSpecs = {
      panelType: spec.type || ' ',
      panelSpecies: spec.species || ' ',
      panelSeasoning: spec.seasoning || ' ',
      panelSeasoningChemical: spec.seasoningChemical || ' ',
      panelGrade: spec.grade || spec.grades || ' ',
      panelFinish: spec.finish || ' ',
      panelMfgProcess: spec.mfgProcess || ' ',
      panelRating: spec.rating || ' ',
      panelStandard: spec.standard || ' ',
      panelThickness: ProductsHelper.getValeFromTargetDimension(spec.thickness),
      panelThicknessName: spec.thickness ? spec.thickness.name + SpecHelper.getUomSymbol(spec.thickness.uom) : ' ',
      panelLength: ProductsHelper.getValeFromTargetDimension(spec.length),
      panelLengthName: spec.length ? spec.length.name + SpecHelper.getUomSymbol(spec.length.uom) : ' ',
      panelWidth: ProductsHelper.getValeFromTargetDimension(spec.width),
      panelWidthName: spec.width ? spec.width.name + SpecHelper.getUomSymbol(spec.width.uom) : ' ',
      panelPatternWidth: spec.patternWidth || ' '
    };

    Object.assign(specObject, panelSpecs);
  }

  private static setSpecEngineered(specObject, spec) {
    const engineeredSpecs = {
      engineeredGrade: spec.grade || spec.grades || ' ',
      engineeredDepth: spec.depth
        ? spec.depth.name
          ? spec.depth.name + SpecHelper.getUomSymbol(spec.depth.uom)
          : spec.depth
        : ' ',
      engineeredType: spec.type || ' ',
      engineeredSeasoning: spec.seasoning || spec.seasonings || ' ',
      engineeredClassification: spec.classification || ' ',
      engineeredCertification: spec.certification || ' ',
      engineeredThickness: ProductsHelper.getValeFromTargetDimension(spec.thickness),
      engineeredThicknessName: spec.thickness ? spec.thickness.name + SpecHelper.getUomSymbol(spec.thickness.uom) : ' ',
      engineeredLength: ProductsHelper.getValeFromTargetDimension(spec.length),
      engineeredLengthName: spec.length ? spec.length.name + SpecHelper.getUomSymbol(spec.length.uom) : ' ',
      engineeredWidth: ProductsHelper.getValeFromTargetDimension(spec.width),
      engineeredWidthName: spec.width ? spec.width.name + SpecHelper.getUomSymbol(spec.width.uom) : ' '
    };

    Object.assign(specObject, engineeredSpecs);
  }

  static getValeFromTargetDimension(data) {
    return data ? (data.uom === 'feet' ? data.value * 12 : data.value) : ' ';
  }

  static computeContractsData(objectToAssign: any, products: ProductEntity[]) {
    const contractProducts = products.filter(product => !!product.contract);
    const contracts = contractProducts.map(product => product.contract);

    if (!contractProducts.length) {
      return;
    }

    const contractObject = {
      contractUnitsCount: contracts.length,
      closedContractUnitsCount: contracts.filter(contract => contract.isClosed).length,
      openContractUnitsCount: contracts.length - contracts.filter(contract => contract.isClosed).length,
      totalContractPrice: contracts.reduce((acc, curr) => (acc += curr.contractPrice || 0), 0),
      avgContractAgeOfMaterials: ProductsHelper.getAveragePurchaseAge(contractProducts),
      avgContractMargin: contractProducts.reduce((acc, curr) => (acc += curr.contractMargin), 0) / contracts.length,
      avgContractSoldPrice:
        contractProducts.reduce((acc, curr) => (acc += curr.priceHistory.soldPrice || 0), 0) / contracts.length,
      avgContractPurchasePrice:
        contractProducts.reduce((acc, curr) => (acc += curr.priceHistory.purchasePrice || 0), 0) / contracts.length,
      contractFirstOpenedDate: contracts
        .map(item => new Date(item.openedDate))
        .filter(date => isValid(date))
        .sort((a, b) => a.getTime() - b.getTime())[0],
      contractFirstClosedDate: contracts
        .map(item => new Date(item.closedDate))
        .filter(date => isValid(date))
        .sort((a, b) => a.getTime() - b.getTime())[0],
      nearestContractExpirationClosedDate: contracts
        .filter(item => item.isOpen)
        .map(item => new Date(item.expirationDate))
        .filter(date => isValid(date))
        .sort((a, b) => a.getTime() - b.getTime())[0]
    };

    Object.assign(objectToAssign, contractObject);
  }

  static specSorting(value1: ProductSpecExtended, value2: ProductSpecExtended): number {
    const thicknessSort = ProductsHelper.sortByDimension(value1.thickness, value2.thickness);
    if (thicknessSort !== 0) return thicknessSort;

    const widthSort = ProductsHelper.sortByDimension(value1.width, value2.width);
    if (widthSort !== 0) return widthSort;

    const lengthSort = ProductsHelper.sortByDimension(value1.length, value2.length);
    if (lengthSort !== 0) return lengthSort;

    const speciesSort = (value1.species || '').localeCompare(value2.species || '');
    if (speciesSort !== 0) return speciesSort;

    const gradeSort = ProductsHelper.sortGrade(value1, value2);
    if (gradeSort !== 0) return gradeSort;

    return value1.specShorthand.localeCompare(value2.specShorthand);
  }

  static sortDimensionValues(value1, value2) {
    if (!TypeCheck.isNumber(parseInt(value1, 10))) {
      value1 = 0;
    }

    if (!TypeCheck.isNumber(parseInt(value2, 10))) {
      value2 = 0;
    }

    const toNumber = val => {
      if (TypeCheck.isNumber(val)) {
        return val;
      }

      return val.split(' ').reduce((acc, curr) => {
        if (curr.includes('/')) {
          const [n1, n2] = curr.split('/').map(n => parseInt(n, 10));
          if (!TypeCheck.isNumber(n1) || !TypeCheck.isNumber(n2)) {
            return acc;
          }

          acc += n1 / n2;
        } else if (TypeCheck.isNumber(parseInt(curr, 10))) {
          acc += parseInt(curr, 10);
        }
        return acc;
      }, 0);
    };

    return toNumber(value1) - toNumber(value2);
  }

  static cutGradeSorting(value1, value2): number {
    const thickness1 = parseInt(value1.slice(0, value1.indexOf('x')), 10);
    const thickness2 = parseInt(value2.slice(0, value2.indexOf('x')), 10);
    if (thickness1 !== thickness2) return thickness1 > thickness2 ? 1 : -1;

    const width1 = parseInt(value1.slice(value1.indexOf('x') + 1, value1.indexOf(' ')), 10);
    const width2 = parseInt(value2.slice(value2.indexOf('x') + 1, value2.indexOf(' ')), 10);
    if (width1 !== width2) return width1 > width2 ? 1 : -1;

    const grade1 = value1.slice(value1.indexOf(' ') + 1);
    const grade2 = value2.slice(value2.indexOf(' ') + 1);
    return ProductsHelper.sortGrade({ grade: grade1 }, { grade: grade2 });
  }

  static sortByDimension(dimension1, dimension2): number {
    if (!dimension1 && dimension2) return -1;
    if (!dimension1 && !dimension2) return 0;
    if (dimension1 && !dimension2) return 1;
    const number1 = parseInt(dimension1.name, 10);
    const number2 = parseInt(dimension2.name, 10);
    if (number1 === number2) return 0;
    return number1 > number2 ? 1 : -1;
  }

  static sortGrade(spec1, spec2): number {
    const gradeOrder = [
      '#1',
      'Prime',
      'Premium',
      'Select',
      '2&Btr',
      '#2',
      'Stud',
      'MSR',
      '3&Btr',
      '#3',
      'Ute&Btr',
      'PMO',
      '#3/4 Mix',
      'Economy',
      '#4',
      'AA',
      'AB',
      'AC',
      'BB',
      'BBOES',
      'BC',
      'CCX',
      'CC',
      'CCPTS',
      'CDX',
      'CD',
      'CDS',
      'Mill Cert',
      'Shop Grade',
      'AorB',
      'CorD',
      'Ind',
      '2.0E',
      '24F',
      '24F Architectural'
    ];
    const subGradeOrder = [
      '#1',
      '#2',
      '2&Btr',
      'Stud',
      'No Prior Select',
      '2850',
      '2700',
      '2400',
      '2100',
      '1950',
      '1650',
      'DSS',
      'SS'
    ];
    const gradeSort = gradeOrder.indexOf(spec2.grade) - gradeOrder.indexOf(spec1.grade);
    if (gradeSort !== 0) return gradeSort;
    const subGradeSort = subGradeOrder.indexOf(spec2.subGrade) - gradeOrder.indexOf(spec1.subGrade);
    if (subGradeSort !== 0) return subGradeSort;
    return 0;
  }
}
