import {Table} from '../src/table';
import {errors} from '../src/literals';
import {expect} from 'code';
import sinon from 'sinon';
import * as fileService from '../src/utilities/file';
import * as idbService from '../src/idb';
import * as schemaService from '../src/utilities/schema';

describe('Given Table', () => {

  const Schema = {foo: 'String'};
  const dbName = 'dbName';
  const tableName = 'tableName';
  let idbInstance,
    sandbox,
    table;

  beforeEach(() => {

    sandbox = sinon.sandbox.create();

    idbInstance = {
      createTable: sandbox.stub(),
      readTable: sandbox.stub()
    };

    sandbox.stub(fileService);
    sandbox.stub(schemaService);
    sandbox.stub(idbService, 'getIDBInstance').returns(idbInstance);

    table = new Table(dbName, tableName, Schema);

  });

  afterEach(() => sandbox.restore());

  it('should be constructed and used as an object', () => {

    expect(table).object();

  });

  describe('when initiating', () => {

    it('should throw if dbName is not given', () => {

      expect(() => new Table()).throws(errors.DB_NAME_IS_REQUIRED);

    });

    it('should throw if tableName is not given', () => {

      expect(() => new Table(dbName)).throws(errors.TABLE_NAME_IS_REQUIRED);

    });

    it('should throw if table does not exist and Schema is not given', () => {

      expect(() => new Table(dbName, tableName)).throws(errors.SCHEMA_NAME_IS_REQUIRED);

    });

    it('should get idb instance', () => {

      sinon.assert.calledOnce(idbService.getIDBInstance);
      sinon.assert.calledWithExactly(idbService.getIDBInstance, dbName);

    });

    it('should parse given Schema', () => {

      sinon.assert.calledOnce(schemaService.parse);
      sinon.assert.calledWithExactly(schemaService.parse, Schema);

    });

    describe('when table exists', () => {

      const storedSchema = {
        stored: 'String'
      };

      beforeEach(() => {

        fileService.doesTableExist.returns(true);
        idbInstance.readTable.returns(storedSchema);

      });

      it('should not throw any error if table exists and Schema is not given', () => {

        expect(() => new Table(dbName, tableName)).not.throws();

      });

      it('should read table schema if table exists', () => {

        idbInstance.createTable.reset();
        idbInstance.readTable.reset();

        new Table(dbName, tableName);

        sinon.assert.notCalled(idbInstance.createTable);
        sinon.assert.calledOnce(idbInstance.readTable);
        sinon.assert.calledWithExactly(idbInstance.readTable, tableName);

      });

      it('should parse stored schema', () => {

        schemaService.parse.reset();

        new Table(dbName, tableName);

        sinon.assert.calledOnce(schemaService.parse);
        sinon.assert.calledWithExactly(schemaService.parse, storedSchema);

      });

    });

    it('should create table schema if table does not exist', () => {

      sinon.assert.notCalled(idbInstance.readTable);
      sinon.assert.calledOnce(idbInstance.createTable);
      sinon.assert.calledWithExactly(idbInstance.createTable, tableName, Schema);

    });

  });

  describe('when saving', () => {

    const callbackIndex = 3;

    beforeEach(() => {

      fileService.saveTable.callsArgWith(callbackIndex, false);

    });

    it('should create the table with default data initially', () => {

      const defaultData = {
        index: {},
        rows: []
      };

      table.save();

      sinon.assert.calledOnce(fileService.saveTable);
      sinon.assert.calledWithExactly(fileService.saveTable, dbName, tableName, defaultData, sinon.match.func);

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
