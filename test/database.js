import {Database} from '../src/database';
import {errors} from '../src/literals';
import {expect} from 'code';
import sinon from 'sinon';
import * as fileService from '../src/utilities/file';
import * as idbService from '../src/utilities/idb';
import * as table from '../src/table';

describe('Given Database', () => {

  const dbName = 'dbName';
  const tableName = 'tableName';
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

    sandbox.stub(fileService, 'deleteDatabase');
    sandbox.stub(table, 'Table');
    sandbox.stub(idbService, 'closeIDB');
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

  });

  describe('when listing table names', () => {

    let tables;

    beforeEach(() => tables = database.list());

    it('should get idb instance', () => {

      sinon.assert.calledOnce(idbService.getIDBInstance);
      sinon.assert.calledWithExactly(idbService.getIDBInstance, dbName);

    });

    it('should return array of table names', () => {

      expect(tables).equals(['table1', 'table2']);

    });

  });

  describe('when instantiating', () => {

    it('should throw if database name is not defined', () => {

      expect(() => new Database()).throws(errors.DB_NAME_IS_REQUIRED);

    });

  });

  describe('when creating a table', () => {

    it('should instantiate Table', () => {

      const Schema = {foo: 'String'};

      database.createTable(tableName, Schema);

      sinon.assert.calledOnce(table.Table);
      sinon.assert.calledWithNew(table.Table);
      sinon.assert.calledWithExactly(table.Table, dbName, tableName, Schema);

    });

  });

  describe('when dropping a table', () => {

    let tableInstance,
      returnValue;

    beforeEach(() => {

      tableInstance = {
        drop: sandbox.stub()
      };

      table.Table.withArgs(dbName, tableName, {}).returns(tableInstance);

      returnValue = database.dropTable(tableName);

    });

    it('should instantiate Table with empty schema to get its instance and drop it', () => {

      sinon.assert.calledOnce(table.Table);
      sinon.assert.calledWithNew(table.Table);
      sinon.assert.calledWithExactly(table.Table, dbName, tableName, {});
      sinon.assert.calledOnce(tableInstance.drop);
      sinon.assert.calledWithExactly(tableInstance.drop);

    });

    it('should return database', () => {

      expect(returnValue).equals(database);

    });

  });

  describe('when dropping database', () => {

    beforeEach(() => database.drop());

    it('should delete the database', () => {

      sinon.assert.calledOnce(fileService.deleteDatabase);
      sinon.assert.calledWithExactly(fileService.deleteDatabase, dbName);

    });

    it('should close idb', () => {

      sinon.assert.calledOnce(idbService.closeIDB);
      sinon.assert.calledWithExactly(idbService.closeIDB, dbName);

    });

  });

});
