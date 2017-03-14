import {Table} from '../src/table';
import {errors} from '../src/literals';
import {expect} from 'code';
import sinon from 'sinon';
import * as columnService from '../src/utilities/column';
import * as fileService from '../src/utilities/file';
import * as idbService from '../src/idb';
import * as queryService from '../src/utilities/query';
import * as schemaService from '../src/utilities/schema';

describe('Given Table', () => {

  const dbName = 'dbName';
  const tableName = 'tableName';
  const loadTableCallback = 2;
  const saveTableCallback = 3;
  const defaultData = {
    index: {},
    lastId: 0,
    rows: []
  };
  let Schema,
    idbInstance,
    sandbox,
    table;

  const getTableSchemas = () => {

    const tableSchemas = new WeakMap();

    tableSchemas.set(table, schemaService.parse(Schema));

    return tableSchemas;

  };

  beforeEach(() => {

    Schema = {foo: 'String'};
    sandbox = sinon.sandbox.create();

    idbInstance = {
      createTable: sandbox.stub()
        .withArgs(tableName, Schema)
        .returns({
          lastId: 0,
          schema: Schema
        }),
      dropTable: sandbox.stub(),
      readTable: sandbox.stub()
        .withArgs(tableName)
        .returns({
          lastId: 0,
          schema: Schema
        }),
      updateTable: sandbox.stub()
    };

    sandbox.stub(columnService);
    sandbox.stub(fileService);
    sandbox.stub(queryService);
    sandbox.stub(schemaService);
    sandbox.stub(idbService, 'getIDBInstance')
      .withArgs(dbName)
      .returns(idbInstance);

    schemaService.parse.returns(Schema);
    queryService.executeQuery.returns(defaultData);

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

      const idbConfig = {
        lastId: 2,
        schema: {
          stored: 'String'
        }
      };

      beforeEach(() => {

        fileService.doesTableExist.returns(true);
        idbInstance.readTable.returns(idbConfig);

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

        idbInstance.createTable.reset();
        schemaService.parse.reset();

        new Table(dbName, tableName);

        sinon.assert.notCalled(idbInstance.createTable);
        sinon.assert.calledOnce(schemaService.parse);
        sinon.assert.calledWithExactly(schemaService.parse, idbConfig.schema);

      });

    });

    it('should create table schema if table does not exist', () => {

      sinon.assert.calledOnce(idbInstance.createTable);
      sinon.assert.calledWithExactly(idbInstance.createTable, tableName, Schema);

    });

  });

  describe('when saving', () => {

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

    it('should resolve data on success', async() => {

      fileService.loadTable.callsArgWith(loadTableCallback, true);
      fileService.saveTable.callsArgWith(saveTableCallback, false);

      const resolvedData = await table.save();

      expect(resolvedData).equals({
        lastId: 0,
        rows: []
      });

    });

    it('should update idb config', async() => {

      fileService.loadTable.callsArgWith(loadTableCallback, true);
      fileService.saveTable.callsArgWith(saveTableCallback, false);

      await table.save();

      sinon.assert.calledOnce(idbInstance.updateTable);
      sinon.assert.calledWithExactly(idbInstance.updateTable, tableName, Schema, 0);

    });

    it('should create the table with default data when failed to load table', () => {

      const saveData = {
        index: defaultData.index,
        rows: defaultData.rows
      };

      fileService.loadTable.callsArgWith(loadTableCallback, true);

      table.save();

      sinon.assert.calledOnce(fileService.saveTable);
      sinon.assert.calledWithExactly(fileService.saveTable, dbName, tableName, saveData, sinon.match.func);

    });

    it('should create the table with loaded data', () => {

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
        {
          ...initialData,
          lastId: 0
        },
        Schema
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
    const queryData = {
      ...data,
      lastId: 0
    };

    beforeEach(() => {

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

      sinon.assert.calledOnce(queryService.executeQuery);
      sinon.assert.calledWithExactly(queryService.executeQuery, sinon.match.object, queryData, Schema);
      expect(queryService.executeQuery.getCall(0).args[0].shouldUpdate()).true();
      expect(queryService.executeQuery.getCall(0).args[0]).includes({
        type: 'update',
        update
      });

    });

    it('should update based on filter function', async() => {

      const filter = row => row.$$idbId > 2;

      await table.update(update, filter).save();

      sinon.assert.calledOnce(queryService.executeQuery);
      sinon.assert.calledWithExactly(queryService.executeQuery,
        {
          shouldUpdate: filter,
          type: 'update',
          update
        },
        queryData,
        Schema
      );

    });

    it('should update based on id', async() => {

      const id = 'row1';

      await table.update(update, id).save();

      sinon.assert.calledOnce(queryService.executeQuery);
      sinon.assert.calledWithExactly(queryService.executeQuery,
        {
          ids: [id],
          type: 'updateById',
          update
        },
        queryData,
        Schema
      );

    });

    it('should update based on array of ids', async() => {

      const ids = ['row1', 'row2'];

      await table.update(update, ids).save();

      sinon.assert.calledOnce(queryService.executeQuery);
      sinon.assert.calledWithExactly(queryService.executeQuery,
        {
          ids,
          type: 'updateById',
          update
        },
        queryData,
        Schema
      );

    });

  });

  describe('when deleting rows', () => {

    const data = {
      index: {},
      rows: [{row: 'row1'}]
    };
    const queryData = {
      ...data,
      lastId: 0
    };

    beforeEach(() => {

      fileService.loadTable.callsArgWith(loadTableCallback, false, data);
      fileService.saveTable.callsArgWith(saveTableCallback, false, data);

    });

    it('should return table', () => {

      expect(table.deleteRows(sandbox.stub())).equals(table);

    });

    it('should delete all rows when there is no filter', async() => {

      await table.deleteRows().save();

      sinon.assert.calledOnce(queryService.executeQuery);
      sinon.assert.calledWithExactly(queryService.executeQuery, sinon.match.object, queryData, Schema);
      expect(queryService.executeQuery.getCall(0).args[0].filter()).true();
      expect(queryService.executeQuery.getCall(0).args[0]).includes({type: 'deleteRows'});

    });

    it('should delete based on filter function', async() => {

      const filter = row => row.$$idbId > 2;

      await table.deleteRows(filter).save();

      sinon.assert.calledOnce(queryService.executeQuery);
      sinon.assert.calledWithExactly(queryService.executeQuery,
        {
          filter,
          type: 'deleteRows'
        },
        queryData,
        Schema
      );

    });

    it('should delete based on id', async() => {

      const id = 'row1';

      await table.deleteRows(id).save();

      sinon.assert.calledOnce(queryService.executeQuery);
      sinon.assert.calledWithExactly(queryService.executeQuery,
        {
          ids: [id],
          type: 'deleteById'
        },
        queryData,
        Schema
      );

    });

    it('should delete based on array of ids', async() => {

      const ids = ['row1', 'row2'];

      await table.deleteRows(ids).save();

      sinon.assert.calledOnce(queryService.executeQuery);
      sinon.assert.calledWithExactly(queryService.executeQuery,
        {
          ids,
          type: 'deleteById'
        },
        queryData,
        Schema
      );

    });

  });

  describe('when reverting', () => {

    it('should clear out queued queries', async() => {

      fileService.loadTable.callsArgWith(loadTableCallback, true);
      fileService.saveTable.callsArgWith(saveTableCallback, false);

      await table
        .insert({foo: 'bar'})
        .revert()
        .save();

      sinon.assert.notCalled(queryService.executeQuery);

      await table
        .insert({foo: 'bar'})
        .save();

      sinon.assert.calledOnce(queryService.executeQuery);

    });

  });

  describe('when dropping', () => {

    it('should delete the table', () => {

      table.drop();

      sinon.assert.calledOnce(idbInstance.dropTable);
      sinon.assert.calledWithExactly(idbInstance.dropTable, tableName);

      sinon.assert.calledOnce(fileService.deleteTable);
      sinon.assert.calledWithExactly(fileService.deleteTable, dbName, tableName);

    });

    it('should allow static call', () => {

      Table.drop(dbName, tableName);

      sinon.assert.calledOnce(idbInstance.dropTable);
      sinon.assert.calledWithExactly(idbInstance.dropTable, tableName);

      sinon.assert.calledOnce(fileService.deleteTable);
      sinon.assert.calledWithExactly(fileService.deleteTable, dbName, tableName);

    });

  });

  describe('when adding columns', () => {

    const column = 'column';
    const defaultValue = 'defaultValue';
    const type = 'Type';

    it('should throw if default value is not given', () => {

      expect(() => table.addColumn(column, type)).throws(errors.INVALID_DEFAULT_VALUE);

    });

    it('should alter column', () => {

      table.addColumn(column, type, defaultValue);

      sinon.assert.calledOnce(columnService.alterColumn);
      sinon.assert.calledWithExactly(columnService.alterColumn, table, getTableSchemas(), column, type, sinon.match.func);

    });

    it('should pass an update function that sets the default value to new column', () => {

      table.addColumn(column, type, defaultValue);

      const updateCallback = 4;
      const update = columnService.alterColumn.getCall(0).args[updateCallback];

      expect(update({foo: 'bar'})).equals({
        column: 'defaultValue',
        foo: 'bar'
      });

    });

    it('should return alter column result', () => {

      const alterColumnPromise = new Promise(() => {});

      columnService.alterColumn.returns(alterColumnPromise);

      expect(table.addColumn(column, type, defaultValue)).equals(alterColumnPromise);

    });

  });

  describe('when dropping columns', () => {

    const updateColumnPromise = new Promise(() => {});
    const column = 'foo';
    let promise;

    beforeEach(() => {

      idbService.getIDBInstance.reset();
      columnService.updateColumn.returns(updateColumnPromise);

      promise = table.dropColumns(column);

    });

    it('should get idb instance', () => {

      sinon.assert.calledOnce(idbService.getIDBInstance);
      sinon.assert.calledWithExactly(idbService.getIDBInstance, dbName);

    });

    it('should read table schema', () => {

      sinon.assert.calledOnce(idbInstance.readTable);
      sinon.assert.calledWithExactly(idbInstance.readTable, tableName);

    });

    it('should remove the columns from schema and update', () => {

      const AlteredSchema = {};

      sinon.assert.calledOnce(columnService.updateColumn);
      sinon.assert.calledWithExactly(columnService.updateColumn, table, getTableSchemas(), AlteredSchema, sinon.match.func);

    });

    it('should pass an update function that returns row as it is', () => {

      const updateCallback = 3;
      const update = columnService.updateColumn.getCall(0).args[updateCallback];

      expect(update({foo: 'bar'})).equals({foo: 'bar'});

    });

    it('should return alter column result', () => {

      expect(promise).equals(updateColumnPromise);

    });

  });

});
