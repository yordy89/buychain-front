import { Injectable } from '@angular/core';
import { Environment } from '@services/app-layer/app-layer.environment';
import { CrmService } from '@services/app-layer/crm/crm.service';
import { ObjectUtil } from '@services/helpers/utils/object-util';
import { first, forkJoin } from 'rxjs';
import { UserService } from '@services/app-layer/user/user.service';
import { ProductsHelper } from '@services/app-layer/products/products-helper';

@Injectable({
  providedIn: 'root'
})
export class AddOffbookProductModalService {
  constructor(private crmService: CrmService, private userService: UserService) {}

  getData() {
    return forkJoin([this.crmService.getAccounts(), this.crmService.getContacts(), this.crmService.getLocations()]);
  }

  getOfflineData(crmAccountId: string, crmLocationId: string, crmContactId: string) {
    return {
      organizationId: crmAccountId,
      shipFromId: crmLocationId,
      sellingContactId: crmContactId
    };
  }

  mapToApiProductLot(item, mfgFacilityShortName, offlineData) {
    return {
      mfgFacilityShortName,
      salesData: {
        priceOfMerit: item.listPricePerUoM,
        shipWeekEstimate: new Date(item.shipWeek)
      },
      offlineData,
      spec: {
        priceSystem: item.priceSystem,
        unitPieceCount: item.unitPieceCount,
        productGroupName: item.specs.productGroupName,
        productName: item.specs.productName,
        pattern: item.specs.patterns,
        seasoning: item.specs.seasonings || item.specs.seasoning,
        cutType: item.specs.cutTypes,
        species: item.specs.species,
        length:
          item.specs.cutTypes === Environment.randomLengthCutType
            ? {
                value:
                  (item.quantity * 1000) /
                  ((item.specs.width.value / 12) * item.specs.thickness.value * item.unitPieceCount),
                uom: 'feet',
                name: 'Random'
              }
            : item.specs.length,
        lengthName: item.specs.lengthName,
        width: item.specs.width,
        thickness: item.specs.thickness,
        subspecies: item.specs.subspecies,
        grade: item.specs.grades,
        subGrade: item.specs.subGrades,
        type: item.specs.type,
        classification: item.specs.classification,
        certification: item.specs.certification,
        depth: item.specs.depth?.value,
        mfgProcess: item.specs.mfgProcess,
        finish: item.specs.finish,
        rating: item.specs.rating,
        standard: item.specs.standard,
        seasoningChemical: item.specs.chemical,
        patternWidth: item.specs.patternWidth
      }
    };
  }

  getUserProductPreferences() {
    const productPreferences = ObjectUtil.getDeepCopy(
      Environment.getCurrentUser()?.normalizedPreferences?.products?.favoriteSpecs || {}
    );
    return Object.keys(productPreferences).map(key => {
      this.migrateProductTemplates(productPreferences[key], 'PRODUCT');
      const spec = productPreferences[key].product;
      const object = {
        specShorthand: productPreferences[key].specShorthand.slice(0, -6),
        key: productPreferences[key].key,
        value: productPreferences[key].product,
        cutShorthand: spec.thickness && spec.width ? `${spec.thickness.name}x${spec.width.name}` : ''
      };
      ProductsHelper.setSpecs(object, spec);
      return object;
    });
  }

  getProductsTemplatesPreferences() {
    const productPreferences = ObjectUtil.getDeepCopy(
      Environment.getCurrentUser()?.normalizedPreferences?.products?.templates || {}
    );
    return Object.keys(productPreferences).map(key => {
      this.migrateProductTemplates(productPreferences[key], 'TEMPLATE');
      const value = productPreferences[key];
      return {
        key: value.key,
        specShorthand: value.specShorthand,
        unitOfMeasure: value.unitOfMeasure,
        unitPieceCount: value.unitPieceCount,
        listPricePerUoM: value.listPricePerUoM,
        priceSystem: value.priceSystem,
        mfgFacilityShortName: value.mfgFacilityShortName,
        offlineData: value.offlineData,
        shipWeek: value.shipWeek,
        specs: value.specs,
        value
      };
    });
  }

  mapToTemplateItem(item, key, mfgFacilityShortName, offlineData) {
    const { unitOfMeasure, specs, specShorthand, priceSystem, shipWeek, unitPieceCount, listPricePerUoM } = item;

    return {
      key,
      specShorthand,
      unitOfMeasure,
      unitPieceCount,
      listPricePerUoM,
      priceSystem,
      mfgFacilityShortName,
      offlineData,
      shipWeek,
      specs,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastRunAt: new Date(),
      version: Environment.currentVersion
    };
  }

  private migrateProductTemplates(entity, type): void {
    // remove migration once Albert confirms all users have higher version then 0.25.12
    const object = type === 'PRODUCT' ? 'product' : 'specs';
    if (entity[object].cutTypes === Environment.randomLengthCutType && !entity.specShorthand.includes('Random')) {
      entity[object].length = { uom: 'feet', value: null, name: 'Random' };
      const index = entity.specShorthand.indexOf(',');
      entity.specShorthand = `${entity.specShorthand.slice(0, index - 1)} Random'${entity.specShorthand.slice(index)}`;

      this.userService
        .updateUserPreferences(entity.key, { ...entity, version: Environment.currentVersion }, true)
        .pipe(first())
        .subscribe();
    }
  }
}
