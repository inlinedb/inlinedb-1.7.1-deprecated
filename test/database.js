import {Database} from '../src/database';
import {expect} from 'code';
import sinon from 'sinon';
import * as idbService from '../src/idb';
import * as table from '../src/table';

describe('Given Database', () => {

  const dbName = 'dbName';
  let database,
    idbInstance,
    sandbox;

  beforeEach(() => {

    sandbox = sinon.sandbox.create();

    idbInstance = {
      config: {
        table1: {},
        table2: {}
      }
    };

    sandbox.stub(table, 'Table');
    sandbox.stub(idbService, 'getIDBInstance')
      .withArgs(dbName)
      .returns(idbInstance);

    database = new Database(dbName);

  });

  afterEach(() => sandbox.restore());

  it('should be constructed and used as an object', () => {

    expect(database).object();

  });

  it('should have getters', () => {

    expect(database.dbName).equals(dbName);

  });

  it('should list table names', () => {

    expect(database.list()).equals(['table1', 'table2']);

  });

  describe('when creating a table', () => {

    it('should instantiate Table', () => {

      const Schema = {foo: 'String'};
      const tableName = 'tableName';

      database.createTable(tableName, Schema);

      sinon.assert.calledOnce(table.Table);
      sinon.assert.calledWithNew(table.Table);
      sinon.assert.calledWithExactly(table.Table, dbName, tableName, Schema);

    });

  });

});
