import { Utils } from '@services/helpers/utils/utils';

describe('utils', () => {
  it('should give the difference array', () => {
    expect(Utils.arrayDiff([1, 2, 3], [1, 2])).toEqual([3]);
    expect(Utils.arrayDiff([], [])).toEqual([]);
    expect(Utils.arrayDiff([], [1])).toEqual([1]);
    expect(Utils.arrayDiff([1], [1])).toEqual([]);
    expect(
      Utils.arrayDiff([{ key: 1 }, { key: 2 }], [{ unit: 1 }, { unit: 2 }, { unit: 3 }, { unit: 4 }], 'key', 'unit')
    ).toEqual([{ unit: 3 }, { unit: 4 }]);

    expect(Utils.arrayDiff([1, 2], [1, 3])).toEqual([]);
  });
});
