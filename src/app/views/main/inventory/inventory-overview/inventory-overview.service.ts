import { Injectable } from '@angular/core';
import { Environment } from '@services/app-layer/app-layer.environment';
import { TransactionStateEnum } from '@services/app-layer/app-layer.enums';
import { AccessControlScope } from '@services/app-layer/permission/permission.interface';
import { TallyEntity } from '@services/app-layer/entities/transaction';
import { TransformHelper } from '@services/helpers/utils/transform-helper';
import { Utils } from '@services/helpers/utils/utils';

@Injectable({
  providedIn: 'root'
})
export class InventoryOverviewService {
  getSearchTxInventoryPayload(): any {
    const vendorPayload = {
      value: { field: 'vendorOnline', comparisonOperator: 'eq', fieldValue: Environment.getCurrentCompany().id }
    };
    const creatorPayload = {
      value: { comparisonOperator: 'eq', field: 'creator', fieldValue: Environment.getCurrentUser().id }
    };
    const statesPayload = {
      children: {
        logicalOperator: 'or',
        items: [
          {
            children: {
              logicalOperator: 'and',
              items: [
                { value: { comparisonOperator: 'eq', field: 'state', fieldValue: TransactionStateEnum.Draft } },
                creatorPayload
              ]
            }
          },
          { value: { comparisonOperator: 'eq', field: 'state', fieldValue: TransactionStateEnum.Quote } }
        ]
      }
    };

    const sellerPayload = {
      value: { field: 'sellerOnline', comparisonOperator: 'eq', fieldValue: Environment.getCurrentUser().id }
    };
    const filters: any = {
      children: {
        logicalOperator: 'and',
        items: [statesPayload]
      }
    };
    if (this.getUserPermissionsForInventory().canUpdateOwnTally) filters.children.items.push(sellerPayload);
    return {
      filters: {
        children: {
          logicalOperator: 'and',
          items: [Utils.getSearchTxExcludeArchivedPayload(), vendorPayload, filters]
        }
      },
      fields: ['tally', 'trackingData']
    };
  }

  normalizeTransaction(t: any): any {
    t.tally = new TallyEntity().init(t.tally);
    t.isSales = true;
    t.getShipFrom = t.trackingData?.sellerData?.onlineData?.shipFrom || {};
    const currentUser = Environment.getCurrentUser();
    const designatedSeller = t.trackingData?.sellerData?.onlineData?.designatedSeller;
    const sellingUsers = t.tally.units.map(u => u.product.owner);
    t.isResourceOwner = designatedSeller?.id === currentUser.id || sellingUsers.some(u => u === currentUser.id);
    t.transactionNumber = TransformHelper.getShortHexGuid(t.id);
    return t;
  }

  getUserPermissionsForInventory(): any {
    const permissions =
      Environment.getCurrentUser().normalizedAccessControlRoles.TRANSACTION.transactionSection.sectionGroup;
    const userPermissions: any = {};
    userPermissions.canReadTransactions =
      permissions.readList.value === AccessControlScope.Company ||
      permissions.readList.value === AccessControlScope.Owner;
    userPermissions.canReadOnlyOwnTx = permissions.readList.value === AccessControlScope.Owner;
    if (userPermissions.canReadTransactions) {
      userPermissions.canUpdateTally =
        permissions.updateTally.value === AccessControlScope.Company ||
        permissions.updateTally.value === AccessControlScope.Owner;
      userPermissions.canUpdateOwnTally = permissions.updateTally.value === AccessControlScope.Owner;
      userPermissions.canCreateTransactions =
        userPermissions.canUpdateTally &&
        (permissions.create.value === AccessControlScope.Company ||
          permissions.create.value === AccessControlScope.Owner);
    }
    return userPermissions;
  }
}
