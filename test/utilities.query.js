import {expect} from 'code';
import sinon from 'sinon';
import * as queryService from '../src/utilities/query';

describe('Given query utility', () => {

  it('should define query types', () => {

    expect(queryService.queryTypes).equals({
      DELETE: 'delete',
      INSERT: 'insert',
      UPDATE: 'update'
    });

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

  it('should execute update queries', () => {

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
      shouldUpdate: row => row.$$idbId === 1,
      type: 'update',
      update: row => ({
        ...row,
        row: 'rowUpdate'
      })
    };
    const result = queryService.executeQuery(query, data);

    expect(result).equals({
      index: {1: 1},
      rows: [
        {
          $$idbId: 1,
          row: 'rowUpdate'
        },
        {
          $$idbId: 2,
          row: 'row2'
        }
      ]
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
      type: 'delete'
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

});
