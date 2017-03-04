import {Table} from '../src/table';
import {expect} from 'code';
import sinon from 'sinon';
import * as fileService from '../src/utilities/file';

describe('Given Table', () => {

  const dbName = 'dbName';
  const tableName = 'tableName';
  let sandbox,
    table;

  beforeEach(() => {

    sandbox = sinon.sandbox.create();

    table = new Table(dbName, tableName);

  });

  afterEach(() => sandbox.restore());

  it('should be constructed and used as an object', () => {

    expect(table).object();

  });

  describe('when saving', () => {

    const callbackIndex = 3;

    beforeEach(() => {

      sandbox.stub(fileService, 'saveTable');

      fileService.saveTable.callsArgWith(callbackIndex, false);

    });

    it('should create the table with empty array initially', () => {

      table.save();

      sinon.assert.calledOnce(fileService.saveTable);
      sinon.assert.calledWithExactly(fileService.saveTable, dbName, tableName, [], sinon.match.func);

    });

    it('should return a promise on save', () => {

      expect(table.save()).instanceOf(Promise);

    });

    it('should reject if there is an error when saving', async() => {

      let rejected = false;

      fileService.saveTable.callsArgWith(callbackIndex, true);

      await table.save().catch(() => rejected = true);

      expect(rejected).true();

    });

  });

});
