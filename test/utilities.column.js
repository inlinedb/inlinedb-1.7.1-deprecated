import {errors} from '../src/literals';
import {expect} from 'code';
import sinon from 'sinon';
import * as columnService from '../src/utilities/column';
import * as idbService from '../src/idb';
import * as schemaService from '../src/utilities/schema';

describe('Given column utility', () => {

  const Schema = {foo: 'String'};
  const dbName = 'dbName';
  const tableName = 'tableName';
  const savePromise = new Promise(() => {});
  let idbInstance,
    parsedSchema,
    sandbox,
    table,
    tableSchemas;

  beforeEach(() => {

    parsedSchema = {foo: 'ParsedSting'};
    sandbox = sinon.sandbox.create();
    tableSchemas = new WeakMap();

    table = {
      dbName,
      save: sandbox.stub().returns(savePromise),
      tableName,
      update: sandbox.stub()
    };

    idbInstance = {
      readTable: sandbox.stub()
        .withArgs(tableName)
        .returns({
          lastId: 0,
          schema: Schema
        })
    };

    sandbox.stub(schemaService, 'parse')
      .withArgs(Schema)
      .returns(parsedSchema);
    sandbox.stub(idbService, 'getIDBInstance')
      .withArgs(dbName)
      .returns(idbInstance);

  });

  afterEach(() => sandbox.restore());

  describe('when updating a column', () => {

    let promise,
      update;

    beforeEach(() => {

      update = sandbox.stub();

      promise = columnService.updateColumn(table, tableSchemas, Schema, update);

    });

    it('should parse schema', () => {

      sinon.assert.calledOnce(schemaService.parse);
      sinon.assert.calledWithExactly(schemaService.parse, Schema);

    });

    it('should set the table schema', () => {

      expect(tableSchemas.get(table)).equals(parsedSchema);

    });

    it('should update the table', () => {

      sinon.assert.calledOnce(table.update);
      sinon.assert.calledWithExactly(table.update, update);

    });

    it('should save the table', () => {

      sinon.assert.calledOnce(table.save);
      sinon.assert.calledWithExactly(table.save);

    });

    it('should return the save promise', () => {

      expect(promise).equals(savePromise);

    });

  });

  describe('when altering column', () => {

    const column = 'column';
    const type = 'Number';
    const AlteredSchema = {
      column: 'Number',
      foo: 'String'
    };
    let promise,
      update;

    beforeEach(() => {

      update = sandbox.stub();

      promise = columnService.alterColumn(table, tableSchemas, column, type, update);

    });

    it('should throw if column is undefined', () => {

      expect(() => columnService.alterColumn(table, tableSchemas, undefined, type, sandbox.stub())).throws(errors.INVALID_COLUMN_NAME);

    });

    it('should throw if type is undefined', () => {

      expect(() => columnService.alterColumn(table, tableSchemas, column, undefined, sandbox.stub())).throws(errors.INVALID_COLUMN_TYPE);

    });

    it('should get idb instance', () => {

      sinon.assert.calledOnce(idbService.getIDBInstance);
      sinon.assert.calledWithExactly(idbService.getIDBInstance, dbName);

    });

    it('should read table from idb instance', () => {

      sinon.assert.calledOnce(idbInstance.readTable);
      sinon.assert.calledWithExactly(idbInstance.readTable, tableName);

    });

    it('should set the column and type in schema', () => {

      expect(Schema).equals(AlteredSchema);

    });

    it('should parse schema', () => {

      sinon.assert.calledOnce(schemaService.parse);
      sinon.assert.calledWithExactly(schemaService.parse, AlteredSchema);

    });

    it('should set the table schema', () => {

      expect(tableSchemas.get(table)).equals(parsedSchema);

    });

    it('should update the table', () => {

      sinon.assert.calledOnce(table.update);
      sinon.assert.calledWithExactly(table.update, update);

    });

    it('should save the table', () => {

      sinon.assert.calledOnce(table.save);
      sinon.assert.calledWithExactly(table.save);

    });

    it('should return the save promise', () => {

      expect(promise).equals(savePromise);

    });

  });

});
