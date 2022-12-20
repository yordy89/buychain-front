import { TypeCheck } from '@services/helpers/utils/type-check';
import { endOfDay, isValid, startOfDay } from 'date-fns';

export class FilterBuilderHelper {
  public static parseAdvancedDxFiltersToBack(
    filterBuilder: any[],
    normalizedFilter: any,
    dateTypeFields: string[]
  ): void {
    if (!TypeCheck.isArray(filterBuilder) || !filterBuilder.length) return normalizedFilter;
    if (TypeCheck.isString(filterBuilder[0])) {
      if (dateTypeFields.includes(filterBuilder[0])) {
        this.parseDateTypeField(filterBuilder, normalizedFilter);
      } else {
        normalizedFilter.value = {
          field: filterBuilder[0],
          comparisonOperator: this.getComparisonOperator(filterBuilder[1]),
          fieldValue: filterBuilder[2]
        };
      }
    } else if (TypeCheck.isArray(filterBuilder[0])) {
      normalizedFilter.children = {
        logicalOperator: filterBuilder[1] || 'and',
        items: filterBuilder
          .filter((item, index) => item && index % 2 === 0)
          .map(item => {
            const child = {};
            this.parseAdvancedDxFiltersToBack(item, child, dateTypeFields);
            return child;
          })
      };
    }
  }

  public static productSoldStateTransform(filterBuilder: any[], normalizedFilter): void {
    if (!TypeCheck.isArray(filterBuilder) || !filterBuilder.length) return normalizedFilter;
    if (TypeCheck.isString(filterBuilder[0])) {
      if (filterBuilder[0] === 'state') {
        if (filterBuilder[2] === 'SOLD') {
          normalizedFilter.push('soldTransactionId', 'ex', filterBuilder[1] === '=');
        } else {
          normalizedFilter.push(filterBuilder, 'and', ['soldTransactionId', 'ex', false]);
        }
      } else {
        normalizedFilter.push(...filterBuilder);
      }
    } else if (TypeCheck.isArray(filterBuilder[0])) {
      normalizedFilter.push(
        ...filterBuilder.map((item, index) => {
          if (!item || index % 2 !== 0) return item;
          const child = [];
          this.productSoldStateTransform(item, child);
          return child;
        })
      );
    }
  }

  private static parseDateTypeField(filterBlock: string[], normalizedFilter: any): void {
    if (filterBlock[1] === '=' || filterBlock[1] === 'between' || filterBlock[1] === '<>') {
      normalizedFilter.children = {
        logicalOperator: filterBlock[1] === '<>' ? 'or' : 'and',
        items: [
          {
            value: {
              field: filterBlock[0],
              comparisonOperator:
                filterBlock[1] === '<>' ? this.getComparisonOperator('<=') : this.getComparisonOperator('>='),
              fieldValue: startOfDay(new Date(TypeCheck.isArray(filterBlock[2]) ? filterBlock[2][0] : filterBlock[2]))
            }
          },
          {
            value: {
              field: filterBlock[0],
              comparisonOperator:
                filterBlock[1] === '<>' ? this.getComparisonOperator('>=') : this.getComparisonOperator('<='),
              fieldValue: endOfDay(new Date(TypeCheck.isArray(filterBlock[2]) ? filterBlock[2][1] : filterBlock[2]))
            }
          }
        ]
      };
    } else if (filterBlock[1] === '>' || filterBlock[1] === '>=' || filterBlock[1] === '<' || filterBlock[1] === '<=') {
      FilterBuilderHelper.applyDateFilters(normalizedFilter, filterBlock);
    }
  }

  private static applyDateFilters(normalizedFilter, filterBlock) {
    normalizedFilter.value = {
      field: filterBlock[0],
      comparisonOperator: FilterBuilderHelper.getComparisonOperator(filterBlock[1]),
      fieldValue:
        filterBlock[1] === '>' || filterBlock[1] === '<='
          ? endOfDay(new Date(filterBlock[2]))
          : startOfDay(new Date(filterBlock[2]))
    };
  }

  public static fixAdvancedFilterDateTypes(filterBlock, dateTypeFields: string[] = []): void {
    if (!TypeCheck.isArray(filterBlock) || !filterBlock.length) return;
    if (TypeCheck.isString(filterBlock[0]) && dateTypeFields.includes(filterBlock[0])) {
      if (filterBlock[1] === 'between') {
        filterBlock[2][0] = new Date(filterBlock[2][0]);
        filterBlock[2][1] = new Date(filterBlock[2][1]);
      } else {
        filterBlock[2] = new Date(filterBlock[2]);
      }
    } else if (TypeCheck.isArray(filterBlock[0])) {
      filterBlock
        .filter((item, index) => index % 2 === 0)
        .map(item => this.fixAdvancedFilterDateTypes(item, dateTypeFields));
    }
  }

  private static getComparisonOperator(input: string): string {
    switch (input) {
      case '=':
        return 'eq';
      case '<>':
        return 'ne';
      case '>':
        return 'gt';
      case '<':
        return 'lt';
      case '>=':
        return 'gte';
      case '<=':
        return 'lte';
      case 'contains':
        return 'cn';
      case 'notcontains':
        return 'nc';
      case 'ex':
        return 'ex';
      default:
        return 'eq';
    }
  }

  public static bookmarkFilterBuilderMigration(filterBlock): void {
    if (!TypeCheck.isArray(filterBlock) || !filterBlock.length) return;
    if (
      filterBlock[0] === 'mfg' ||
      filterBlock[0] === 'ageAcquiredDate' ||
      (filterBlock[0] === 'state' && filterBlock[2] === 'PRODUCTION')
    ) {
      filterBlock.length = 0;
    } else if (TypeCheck.isArray(filterBlock[0])) {
      filterBlock.filter((item, index) => index % 2 === 0).map(item => this.bookmarkFilterBuilderMigration(item));
      if (TypeCheck.isArray(filterBlock[0]) && filterBlock[0].length === 0) {
        filterBlock.shift();
        filterBlock.shift();
      }
    }
  }

  static getDateForRange(date, isEndOfDay = false) {
    if (!date) {
      return null;
    }

    date = new Date(date);

    if (!isValid(date)) {
      return null;
    }

    return isEndOfDay ? endOfDay(date) : startOfDay(date);
  }
}
