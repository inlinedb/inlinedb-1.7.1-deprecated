import {String, struct} from 'tcomb';
import {expect} from 'code';
import * as queryService from '../src/utilities/query';

describe('Given query utility', () => {

  it('should define query types', () => {

    expect(queryService.queryTypes).equals({
      DELETE_BY_ID: 'deleteById',
      DELETE_ROWS: 'deleteRows',
      INSERT: 'insert',
      UPDATE: 'update',
      UPDATE_BY_ID: 'updateById'
    });

  });

  it('should return the data without modification for invalid query', () => {

    const data = 'data';

    expect(queryService.executeQuery({type: '!@#$%^&*()'}, data)).equals(data);

  });

  it('should execute insert queries', () => {

    const data = {
      index: {},
      lastId: 0,
      rows: []
    };
    const query = {
      rows: [
        {row: 'row1'},
        {row: 'row2'}
      ],
      type: 'insert'
    };
    const result = queryService.executeQuery(query, data);

    expect(result).equals({
      index: {
        [data.lastId + 1]: 0,
        [data.lastId + 2]: 1
      },
      lastId: 2,
      rows: [
        {
          $$idbId: data.lastId + 1,
          row: 'row1'
        },
        {
          $$idbId: data.lastId + 2,
          row: 'row2'
        }
      ]
    });

  });

  describe('when executing update queries', () => {

    const Schema = struct({row: String});
    const mutativeUpdate = row => {

      row.row = 'rowUpdate';

      return row;

    };
    const update = row => ({
      ...row,
      row: 'rowUpdate'
    });
    const data = {
      index: {
        0: 0,
        1: 1
      },
      lastId: 1,
      rows: [
        {
          $$idbId: 0,
          row: 'row1'
        },
        {
          $$idbId: 1,
          row: 'row2'
        }
      ]
    };

    it('should execute by filter function', () => {

      const query = {
        shouldUpdate: row => row.$$idbId === 0,
        type: 'update',
        update
      };
      const result = queryService.executeQuery(query, data, Schema);

      expect(result).equals({
        index: {
          0: 0,
          1: 1
        },
        lastId: 1,
        rows: [
          {
            $$idbId: 0,
            row: 'rowUpdate'
          },
          {
            $$idbId: 1,
            row: 'row2'
          }
        ]
      });

    });

    it('should execute by ids', () => {

      const query = {
        ids: [1],
        type: 'updateById',
        update
      };
      const result = queryService.executeQuery(query, data, Schema);

      expect(data.rows[1].row).equals('row2');
      expect(result).equals({
        index: {
          0: 0,
          1: 1
        },
        lastId: 1,
        rows: [
          {
            $$idbId: 0,
            row: 'row1'
          },
          {
            $$idbId: 1,
            row: 'rowUpdate'
          }
        ]
      });

    });

    it('should not allow update function to mutate the row', () => {

      const queryByFilter = {
        shouldUpdate: () => true,
        type: 'update',
        update: mutativeUpdate
      };
      const queryByIds = {
        ids: [1],
        type: 'updateById',
        update: mutativeUpdate
      };

      expect(() => queryService.executeQuery(queryByFilter, data, Schema)).throws();
      expect(() => queryService.executeQuery(queryByIds, data, Schema)).throws();

    });

  });

  describe('when executing delete queries', () => {

    const data = {
      index: [0, 1, 2],
      lastId: 2,
      rows: [
        {
          $$idbId: 0,
          row: 'row1'
        },
        {
          $$idbId: 1,
          row: 'row2'
        },
        {
          $$idbId: 2,
          row: 'row2'
        }
      ]
    };

    it('should execute by filter function', () => {

      const query = {
        filter: row => row.$$idbId > 0,
        type: 'deleteRows'
      };
      const result = queryService.executeQuery(query, data);

      expect(result).equals({
        index: {0: 0},
        lastId: 2,
        rows: [
          {
            $$idbId: 0,
            row: 'row1'
          }
        ]
      });

    });

    it('should execute by ids', () => {

      const query = {
        ids: [2, 0],
        type: 'deleteById'
      };
      const rowsLength = 3;
      const result = queryService.executeQuery(query, data);

      expect(data.rows).length(rowsLength);
      expect(data.index).length(rowsLength);
      expect(result).equals({
        index: {1: 0},
        lastId: 2,
        rows: [
          {
            $$idbId: 1,
            row: 'row2'
          }
        ]
      });

    });

  });

});
