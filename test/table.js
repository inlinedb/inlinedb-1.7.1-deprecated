import {Table} from '../src/table';
import {errors} from '../src/literals';
import {expect} from 'code';
import sinon from 'sinon';
import * as fileService from '../src/utilities/file';
import * as idbService from '../src/idb';
import * as queryService from '../src/utilities/query';
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
    sandbox.stub(queryService);
    sandbox.stub(schemaService);
    sandbox.stub(idbService, 'getIDBInstance').returns(idbInstance);

    schemaService.parse.returns(Schema);

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

    const saveTableCallback = 3;

    beforeEach(() => {

      fileService.saveTable.callsArgWith(saveTableCallback, false);

    });

    it('should loadTable before saving', () => {

      table.save();

      sinon.assert.calledOnce(fileService.loadTable);
      sinon.assert.calledWithExactly(fileService.loadTable, dbName, tableName, sinon.match.func);

    });

    it('should return a promise on save', () => {

      expect(table.save()).instanceOf(Promise);

    });

    it('should create the table with default data when failed to load table', () => {

      const loadTableCallback = 2;
      const defaultData = {
        index: {},
        rows: []
      };

      fileService.loadTable.callsArgWith(loadTableCallback, true);

      table.save();

      sinon.assert.calledOnce(fileService.saveTable);
      sinon.assert.calledWithExactly(fileService.saveTable, dbName, tableName, defaultData, sinon.match.func);

    });

    it('should create the table with loaded data', () => {

      const loadTableCallback = 2;
      const data = {
        index: {},
        rows: [{row: 'row1'}]
      };

      fileService.loadTable.callsArgWith(loadTableCallback, false, data);

      table.save();

      sinon.assert.calledOnce(fileService.saveTable);
      sinon.assert.calledWithExactly(fileService.saveTable, dbName, tableName, data, sinon.match.func);

    });

    it('should reject if there is an error when saving', async() => {

      const loadTableCallback = 2;
      let rejected = false;

      fileService.loadTable.callsArgWith(loadTableCallback, true);
      fileService.saveTable.callsArgWith(saveTableCallback, true);

      await table.save().catch(() => rejected = true);

      expect(rejected).true();

    });

  });

  describe('when inserting rows', () => {

    const rows = [
      {row: 'row1'},
      {row: 'row2'}
    ];

    it('should validate them', () => {

      table.insert(...rows);

      sinon.assert.calledOnce(schemaService.validate);
      sinon.assert.calledWithExactly(schemaService.validate, Schema, ...rows);

    });

    it('should execute the insert query on save', () => {

      const loadTableCallback = 2;
      const initialData = {
        index: {},
        rows: []
      };

      fileService.loadTable.callsArgWith(loadTableCallback, false, initialData);

      table.insert(...rows);

      table.save();

      sinon.assert.calledOnce(queryService.executeQuery);
      sinon.assert.calledWithExactly(
        queryService.executeQuery,
        {
          rows,
          type: queryService.queryTypes.INSERT,
        },
        initialData
      );

    });

    it('should return table', () => {

      expect(table.insert(...rows)).equals(table);

    });

  });

  describe('when querying rows', () => {

    const data = {
      index: {
        row1: 0,
        row2: 1
      },
      rows: [
        {row: 'row1'},
        {row: 'row2'}
      ]
    };

    it('should load table to search', () => {

      table.query();

      sinon.assert.calledOnce(fileService.loadTable);
      sinon.assert.calledWithExactly(fileService.loadTable, dbName, tableName, sinon.match.func);

    });

    describe('when successfully loaded table', () => {

      const loadTableCallback = 2;

      beforeEach(() => fileService.loadTable.callsArgWith(loadTableCallback, false, data));

      it('should return all rows when there is no filter', async() => {

        const result = await table.query();

        expect(result).equals(data.rows);

      });

      it('should filter based on id', async() => {

        const result = await table.query('row1');

        expect(result).equals([data.rows[0]]);

      });

      it('should filter based on array of ids', async() => {

        const result = await table.query(['row2', 'row1']);

        expect(result).equals([data.rows[1], data.rows[0]]);

      });

      it('should filter based on filter function', async() => {

        const result = await table.query(row => row.row === 'row2');

        expect(result).equals([data.rows[1]]);

      });

    });

    describe('when failed to load table', () => {

      it('should reject', async() => {

        const loadTableCallback = 2;
        let rejected = false;

        fileService.loadTable.callsArgWith(loadTableCallback, true);

        await table.query().catch(() => rejected = true);

        expect(rejected).true();

      });

    });

  });

  describe('when updating rows', () => {

    const update = row => ({...row});
    const data = {
      index: {},
      rows: [{row: 'row1'}]
    };

    beforeEach(() => {

      const saveTableCallback = 3;
      const loadTableCallback = 2;

      fileService.loadTable.callsArgWith(loadTableCallback, false, data);
      fileService.saveTable.callsArgWith(saveTableCallback, false, data);

    });

    it('should return table', () => {

      expect(table.update(sandbox.stub())).equals(table);

    });

    it('should throw if no update function is provided', () => {

      expect(() => table.update()).throws(errors.INVALID_UPDATE_FUNCTION);

    });

    it('should update all rows when there is no filter', async() => {

      await table.update(update).save();

      expect(queryService.executeQuery.getCall(0).args[0].shouldUpdate()).true();
      sinon.assert.calledOnce(queryService.executeQuery);
      sinon.assert.calledWithMatch(queryService.executeQuery,
        {
          type: 'update',
          update
        },
        data
      );

    });

    it('should update based on filter function', async() => {

      const filter = row => row.$$idbId > 2;

      await table.update(update, filter).save();

      sinon.assert.calledOnce(queryService.executeQuery);
      sinon.assert.calledWithMatch(queryService.executeQuery,
        {
          shouldUpdate: filter,
          type: 'update',
          update
        },
        data
      );

    });

    it('should update based on id', async() => {

      const id = 'row1';

      await table.update(update, id).save();

      sinon.assert.calledOnce(queryService.executeQuery);
      sinon.assert.calledWithMatch(queryService.executeQuery,
        {
          ids: [id],
          type: 'updateById',
          update
        },
        data
      );

    });

    it('should update based on array of ids', async() => {

      const ids = ['row1', 'row2'];

      await table.update(update, ids).save();

      sinon.assert.calledOnce(queryService.executeQuery);
      sinon.assert.calledWithMatch(queryService.executeQuery,
        {
          ids,
          type: 'updateById',
          update
        },
        data
      );

    });

  });

  describe('when deleting rows', () => {

    const data = {
      index: {},
      rows: [{row: 'row1'}]
    };

    beforeEach(() => {

      const saveTableCallback = 3;
      const loadTableCallback = 2;

      fileService.loadTable.callsArgWith(loadTableCallback, false, data);
      fileService.saveTable.callsArgWith(saveTableCallback, false, data);

    });

    it('should return table', () => {

      expect(table.deleteRows(sandbox.stub())).equals(table);

    });

    it('should delete all rows when there is no filter', async() => {

      await table.deleteRows().save();

      expect(queryService.executeQuery.getCall(0).args[0].filter()).true();
      sinon.assert.calledOnce(queryService.executeQuery);
      sinon.assert.calledWithMatch(queryService.executeQuery,
        {
          type: 'deleteRows'
        },
        data
      );

    });

    it('should delete based on filter function', async() => {

      const filter = row => row.$$idbId > 2;

      await table.deleteRows(filter).save();

      sinon.assert.calledOnce(queryService.executeQuery);
      sinon.assert.calledWithMatch(queryService.executeQuery,
        {
          filter,
          type: 'deleteRows'
        },
        data
      );

    });

    it('should delete based on id', async() => {

      const id = 'row1';

      await table.deleteRows(id).save();

      sinon.assert.calledOnce(queryService.executeQuery);
      sinon.assert.calledWithMatch(queryService.executeQuery,
        {
          ids: [id],
          type: 'deleteById'
        },
        data
      );

    });

    it('should delete based on array of ids', async() => {

      const ids = ['row1', 'row2'];

      await table.deleteRows(ids).save();

      sinon.assert.calledOnce(queryService.executeQuery);
      sinon.assert.calledWithMatch(queryService.executeQuery,
        {
          ids,
          type: 'deleteById'
        },
        data
      );

    });

  });

});
