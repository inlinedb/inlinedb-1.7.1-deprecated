import {String, struct} from 'tcomb';
import {expect} from 'code';
import sinon from 'sinon';
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

    const clock = sinon.useFakeTimers();
    const data = {
      index: {},
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
    const time = new Date().getTime();

    expect(result).equals({
      index: {
        [time + 1]: 0,
        [time + 2]: 1
      },
      rows: [
        {
          $$idbId: `${time + 1}`,
          row: 'row1'
        },
        {
          $$idbId: `${time + 2}`,
          row: 'row2'
        }
      ]
    });

    clock.restore();

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

    it('should execute by filter function', () => {

      const data = {
        index: {1: 1},
        rows: [
          {
            $$idbId: '1',
            row: 'row1'
          },
          {
            $$idbId: '2',
            row: 'row2'
          }
        ]
      };
      const query = {
        shouldUpdate: row => row.$$idbId === '1',
        type: 'update',
        update
      };
      const result = queryService.executeQuery(query, data, Schema);

      expect(result).equals({
        index: {1: 1},
        rows: [
          {
            $$idbId: '1',
            row: 'rowUpdate'
          },
          {
            $$idbId: '2',
            row: 'row2'
          }
        ]
      });

    });

    it('should execute by ids', () => {

      const data = {
        index: [0, 1],
        rows: [
          {
            $$idbId: '0',
            row: 'row1'
          },
          {
            $$idbId: '1',
            row: 'row2'
          }
        ]
      };
      const query = {
        ids: ['1'],
        type: 'updateById',
        update
      };
      const result = queryService.executeQuery(query, data, Schema);

      expect(data.rows[1].row).equals('row2');
      expect(result).equals({
        index: [0, 1],
        rows: [
          {
            $$idbId: '0',
            row: 'row1'
          },
          {
            $$idbId: '1',
            row: 'rowUpdate'
          }
        ]
      });

    });

    it('should not allow update function to mutate the row', () => {

      const data = {
        index: {1: 0},
        rows: [
          {
            $$idbId: '1',
            row: 'row1'
          }
        ]
      };
      const queryByFilter = {
        shouldUpdate: () => true,
        type: 'update',
        update: mutativeUpdate
      };
      const queryByIds = {
        ids: ['1'],
        type: 'updateById',
        update: mutativeUpdate
      };

      expect(() => queryService.executeQuery(queryByFilter, data, Schema)).throws();
      expect(() => queryService.executeQuery(queryByIds, data, Schema)).throws();

    });

  });

  it('should execute delete queries', () => {

    const data = {
      index: {1: 1},
      rows: [
        {
          $$idbId: 1,
          row: 'row1'
        },
        {
          $$idbId: 2,
          row: 'row2'
        }
      ]
    };
    const query = {
      filter: row => row.$$idbId > 1,
      type: 'deleteRows'
    };
    const result = queryService.executeQuery(query, data);

    expect(result).equals({
      index: {1: 0},
      rows: [
        {
          $$idbId: 1,
          row: 'row1'
        }
      ]
    });

  });

  it('should execute delete by id queries', () => {

    const data = {
      index: [0, 1, 2],
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
      rows: [
        {
          $$idbId: 1,
          row: 'row2'
        }
      ]
    });

  });

});
