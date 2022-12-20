import { Injectable } from '@angular/core';
import {
  AccountingJournalReviewStatusEnum,
  AccountingJournalStateEnum,
  AccountingJournalStatusEnum
} from '@services/app-layer/app-layer.enums';
import { GroupEntity } from '@services/app-layer/entities/group';
import { FilterBuilderHelper } from '@services/helpers/utils/filter-builder-helper';

@Injectable({
  providedIn: 'root'
})
export class JournalEntriesFiltersService {
  getJournalEntriesSearchPayload(limit: number, offset: number, filters, groups: GroupEntity[]): any {
    let advancedFilter: any = {
      children: {
        logicalOperator: 'and',
        items: [
          this.getGroup(filters, groups),
          ...this.getPostDate(filters),
          ...this.getReverseDate(filters),
          ...this.getApprovalDate(filters),
          this.getTypes(filters),
          this.getCreatedBy(filters),
          this.getLastModifiedBy(filters),
          this.getApprover(filters),
          this.getDimension(filters),
          this.getLineAccount(filters),
          this.getSources(filters),
          this.getStatus(filters)
        ].filter(val => !!val)
      }
    };

    if (!advancedFilter.children.items.length) {
      advancedFilter = {
        children: {
          logicalOperator: 'or',
          items: [
            { value: { field: 'postDate', comparisonOperator: 'lt', fieldValue: new Date() } },
            { value: { field: 'postDate', comparisonOperator: 'gte', fieldValue: new Date() } }
          ]
        }
      };
    }
    return {
      limit,
      offset,
      filters: advancedFilter
    };
  }

  private getGroup(filters, groups: GroupEntity[]) {
    if (!filters.group) {
      return null;
    }

    if (!filters.includeChildGroups) {
      return { value: { field: 'group', comparisonOperator: 'eq', fieldValue: filters.group } };
    }

    const targetGroups = groups
      .filter(item => (item.parentTree || []).includes(filters.group) || item.id === filters.group)
      .map(item => ({ value: { field: 'group', comparisonOperator: 'eq', fieldValue: item.id } }));

    return {
      children: {
        logicalOperator: 'or',
        items: targetGroups
      }
    };
  }

  private getPostDate(filters) {
    const result = [];
    const dateFrom = FilterBuilderHelper.getDateForRange(filters.postDateFrom);
    const dateTo = FilterBuilderHelper.getDateForRange(filters.postDateTo, true);

    if (dateFrom) {
      result.push({ value: { field: 'postDate', comparisonOperator: 'gte', fieldValue: dateFrom } });
    }

    if (dateTo) {
      result.push({ value: { field: 'postDate', comparisonOperator: 'lte', fieldValue: dateTo } });
    }

    return result;
  }

  private getReverseDate(filters) {
    const result = [];
    const dateFrom = FilterBuilderHelper.getDateForRange(filters.reverseDateFrom);
    const dateTo = FilterBuilderHelper.getDateForRange(filters.reverseDateTo, true);

    if (dateFrom) {
      result.push({ value: { field: 'reverseDate', comparisonOperator: 'gte', fieldValue: dateFrom } });
    }

    if (dateTo) {
      result.push({ value: { field: 'reverseDate', comparisonOperator: 'lte', fieldValue: dateTo } });
    }

    return result;
  }

  private getApprovalDate(filters) {
    const result = [];
    const dateFrom = FilterBuilderHelper.getDateForRange(filters.approvalDateFrom);
    const dateTo = FilterBuilderHelper.getDateForRange(filters.approvalDateTo, true);

    if (dateFrom) {
      result.push({ value: { field: 'approvalDate', comparisonOperator: 'gte', fieldValue: dateFrom } });
    }

    if (dateTo) {
      result.push({ value: { field: 'approvalDate', comparisonOperator: 'lte', fieldValue: dateTo } });
    }

    return result;
  }

  private getTypes(filters) {
    if (filters.type?.length) {
      return {
        children: {
          logicalOperator: 'or',
          items: filters.type.map(type => ({ value: { field: 'type', comparisonOperator: 'eq', fieldValue: type } }))
        }
      };
    }
  }

  private getCreatedBy(filters) {
    if (filters.createdBy) {
      return { value: { field: 'createdBy', comparisonOperator: 'eq', fieldValue: filters.createdBy } };
    }
  }

  private getLastModifiedBy(filters) {
    if (filters.lastModifiedBy) {
      return { value: { field: 'lastModifiedBy', comparisonOperator: 'eq', fieldValue: filters.lastModifiedBy } };
    }
  }

  private getApprover(filters) {
    if (filters.approver) {
      return { value: { field: 'approver', comparisonOperator: 'eq', fieldValue: filters.approver } };
    }
  }

  private getDimension(filters) {
    if (filters.dimension) {
      return { value: { field: 'dimension', comparisonOperator: 'eq', fieldValue: filters.dimension } };
    }
  }

  private getLineAccount(filters) {
    if (filters.account) {
      return { value: { field: 'lineAccount', comparisonOperator: 'eq', fieldValue: filters.account } };
    }
  }

  private getSources(filters) {
    if (filters.source?.length) {
      return {
        children: {
          logicalOperator: 'or',
          items: filters.source.map(source => ({
            value: { field: 'source', comparisonOperator: 'eq', fieldValue: source }
          }))
        }
      };
    }
  }

  private getStatus(filters) {
    const items = (filters.status || [])
      .map(value => {
        if (value === AccountingJournalStatusEnum.APPROVED) {
          return {
            value: { field: 'state', comparisonOperator: 'eq', fieldValue: AccountingJournalStateEnum.APPROVED }
          };
        }

        let reviewStatus;

        if (value === AccountingJournalStatusEnum.REJECTED) {
          reviewStatus = AccountingJournalReviewStatusEnum.REJECT;
        } else if (value === AccountingJournalStatusEnum.UNDER_REVIEW) {
          reviewStatus = AccountingJournalReviewStatusEnum.REQUEST;
        } else if (value === AccountingJournalStatusEnum.DRAFT) {
          reviewStatus = AccountingJournalReviewStatusEnum.NONE;
        }

        if (!reviewStatus) {
          return;
        }

        return {
          children: {
            logicalOperator: 'and',
            items: [
              { value: { comparisonOperator: 'ne', field: 'state', fieldValue: AccountingJournalStateEnum.APPROVED } },
              { value: { comparisonOperator: 'eq', field: 'reviewStatus', fieldValue: reviewStatus } }
            ]
          }
        };
      })
      .filter(val => !!val);

    if (!items.length) {
      return null;
    }

    return {
      children: {
        logicalOperator: 'or',
        items
      }
    };
  }
}
