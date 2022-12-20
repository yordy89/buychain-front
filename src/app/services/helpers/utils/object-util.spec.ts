import { ObjectUtil } from '@services/helpers/utils/object-util';

describe('ObjectUtil', () => {
  describe('deleteEmptyProperties', () => {
    it('should return empty object if argument is empty obj', () => {
      expect(ObjectUtil.deleteEmptyProperties({})).toEqual({});
    });

    it('should remove empty and leave non empty props recursively', () => {
      expect(
        ObjectUtil.deleteEmptyProperties({
          key1: undefined,
          key2: null,
          key3: '',
          key4: {},
          key5: 0,
          key7: false,
          key8: 'false',
          key9: 'string',
          innerObj: {
            key1: undefined,
            key2: null,
            key3: '',
            key4: {},
            key5: 0,
            key7: false,
            key8: 'false',
            key9: 'string',
            innerObj: {
              key1: undefined,
              key9: 'string'
            },
            emptyInnerObj: {
              innerObj: {
                key1: undefined
              }
            }
          }
        })
      ).toEqual({
        key5: 0,
        key7: false,
        key8: 'false',
        key9: 'string',
        innerObj: {
          key5: 0,
          key7: false,
          key8: 'false',
          key9: 'string',
          innerObj: {
            key9: 'string'
          }
        }
      });
    });
  });

  describe('isDeepEquals', () => {
    it('empty objects should be equal', function () {
      expect(ObjectUtil.isDeepEquals({}, {})).toBeTruthy();
    });

    it('empty array should be equal', function () {
      expect(ObjectUtil.isDeepEquals([], [])).toBeTruthy();
    });

    it('array having same values in same order should be equal', function () {
      expect(ObjectUtil.isDeepEquals([1, 2, 3], [1, 2, 3])).toBeTruthy();
    });

    it('array having same values in different order should be equal', function () {
      expect(ObjectUtil.isDeepEquals([1, 2, 3], [3, 2, 1])).toBeTruthy();
    });

    it('arrays should be equal', function () {
      expect(ObjectUtil.isDeepEquals([{}, 2, 3], [{}, 3, 2])).toBeTruthy();
      expect(ObjectUtil.isDeepEquals([{ key1: 'same' }, 2, 3], [{ key1: 'same' }, 3, 2])).toBeTruthy();
      expect(ObjectUtil.isDeepEquals([{ key1: [3, 2, 1] }, 2, 3], [{ key1: [1, 2, 3] }, 3, 2])).toBeTruthy();
      const obj1 = {
        key2: {
          inner: [1, 2, 3],
          inner2: {
            a: null,
            b: [null, 34, 'true', false]
          }
        }
      };
      const obj2 = ObjectUtil.getDeepCopy(obj1);

      expect(ObjectUtil.isDeepEquals(obj1, obj2)).toBeTruthy();
    });

    it('arrays should NOT be equal', function () {
      // eslint-disable-next-line no-sparse-arrays
      expect(ObjectUtil.isDeepEquals([{}, 2, 3], [, 3, 2])).toBeFalsy();
      expect(ObjectUtil.isDeepEquals([1, 2, 3], [3, 2])).toBeFalsy();
      expect(ObjectUtil.isDeepEquals([[], 2, 3], [3, 2])).toBeFalsy();
    });

    it('arrays should not be equal #1', function () {
      expect(ObjectUtil.isDeepEquals([null, 2, 3], [3, 2])).toBeFalsy();
    });

    it('arrays should not be equal #2', function () {
      expect(ObjectUtil.isDeepEquals([undefined, 2, 3], [3, 2])).toBeFalsy();
    });

    it('arrays should not be equal #3', function () {
      // eslint-disable-next-line no-sparse-arrays
      expect(ObjectUtil.isDeepEquals([, 2, 3], [3, 2])).toBeFalsy();
    });

    it('arrays should not be equal #4', function () {
      expect(ObjectUtil.isDeepEquals([1, 2, 3], [[1], 3, 2])).toBeFalsy();
    });

    it('arrays should not be equal #5', function () {
      expect(ObjectUtil.isDeepEquals([2, 2, 3], [3, 3, 2])).toBeFalsy();
    });

    it('arrays should NOT be equal #1', function () {
      expect(ObjectUtil.isDeepEquals([2, 2, 3], [3, 3, 2])).toBeFalsy();
    });

    it('arrays should NOT be equal #2', function () {
      expect(ObjectUtil.isDeepEquals([{ key1: 2 }, 2, 3], [{ key1: 1 }, 3, 2])).toBeFalsy();
    });

    it('should be equal', function () {
      const date = new Date();
      const a = {
        key1: 'string',
        key2: true,
        key3: null,
        key4: undefined,
        key5: {},
        key6: [],
        key7: date,
        key8: {
          key1: 'string',
          key2: true,
          key3: null,
          key4: [1, true, 'string']
        }
      };
      const b = {
        key1: 'string',
        key2: true,
        key3: null,
        key4: undefined,
        key5: {},
        key6: [],
        key7: date,
        key8: {
          key1: 'string',
          key2: true,
          key3: null,
          key4: [1, true, 'string']
        }
      };

      expect(ObjectUtil.isDeepEquals(a, b)).toBeTruthy();
    });

    it('should NOT be equal #3', function () {
      const a = {
        key1: 'string'
      };
      const b = {
        key1: 'other'
      };

      expect(ObjectUtil.isDeepEquals(a, b)).toBeFalsy();
    });

    it('should NOT be equal #4', function () {
      const a = {
        key1: 'same'
      };
      const b = {
        key2: 'same'
      };

      expect(ObjectUtil.isDeepEquals(a, b)).toBeFalsy();
    });

    it('should NOT be equal #5', function () {
      const a = {
        key1: 1
      };
      const b = {
        key1: '1'
      };

      expect(ObjectUtil.isDeepEquals(a, b)).toBeFalsy();
    });

    it('should NOT be equal #6', function () {
      const a = {
        key1: [1]
      };
      const b = {
        key1: ['1']
      };

      expect(ObjectUtil.isDeepEquals(a, b)).toBeFalsy();
    });

    it('should NOT be equal #7', function () {
      const a = {
        key1: [1, 2]
      };
      const b = {
        key1: [1]
      };

      expect(ObjectUtil.isDeepEquals(a, b)).toBeFalsy();
    });
  });
});
