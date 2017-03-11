import {closeIDB, getIDBInstance} from '../src/idb';
import {expect} from 'code';
import sinon from 'sinon';
import * as fileService from '../src/utilities/file';

describe('Given IDB', () => {

  const Schema = {schema: 'schema'};
  const dbName = 'dbName';
  const tableName = 'tableName';
  let idbData,
    sandbox;

  beforeEach(() => {

    idbData = {
      [tableName]: {
        lastId: 1,
        schema: Schema
      }
    };

    sandbox = sinon.sandbox.create();

    sandbox.stub(fileService, 'loadIDB').returns(Object.assign({}, idbData));
    sandbox.stub(fileService, 'saveIDB');

  });

  afterEach(() => {

    sandbox.restore();

    closeIDB(dbName);

  });

  it('should return a unique instance for each dbName', () => {

    const dbName1 = 'dbName1';
    const dbName2 = 'dbName2';
    const sameTable = {tableName};

    fileService.loadIDB.returns(sameTable);

    const idbInstance1 = getIDBInstance(dbName1);
    const idbInstance2 = getIDBInstance(dbName2);

    idbInstance1.createTable('tableName1', {});
    idbInstance2.createTable('tableName2', {});

    expect(idbInstance1).shallow.equals(getIDBInstance(dbName1));
    expect(idbInstance1).shallow.equals(getIDBInstance(dbName1));
    expect(idbInstance2).shallow.equals(getIDBInstance(dbName2));

    expect(idbInstance1).equals(getIDBInstance(dbName2));
    expect(idbInstance2).equals(getIDBInstance(dbName1));
    expect(idbInstance1).not.shallow.equals(getIDBInstance(dbName2));

    closeIDB(dbName1);
    closeIDB(dbName2);

  });

  it('should destroy the instance when closed', () => {

    const idbInstanceBeforeClosing = getIDBInstance(dbName);

    closeIDB(dbName);

    const idbInstanceAfterClosing = getIDBInstance(dbName);

    expect(idbInstanceBeforeClosing).not.shallow.equals(idbInstanceAfterClosing);
    expect(idbInstanceBeforeClosing).equals(idbInstanceAfterClosing);

  });

  describe('when instantiating', () => {

    it('should load idb', () => {

      getIDBInstance(dbName);

      sinon.assert.calledOnce(fileService.loadIDB);
      sinon.assert.calledWithExactly(fileService.loadIDB, dbName);

    });

    it('should have resolved data if idb exists', () => {

      const idb = getIDBInstance(dbName);

      expect(idb.readTable(tableName)).equals(idbData[tableName]);

    });

  });

  describe('when creating table', () => {

    it('should add it to idb and save', () => {

      const idb = getIDBInstance(dbName);
      const newIdbConfig = {
        lastId: 0,
        schema: Schema
      };

      idb.createTable(tableName, Schema);

      expect(idb.readTable(tableName)).equals(newIdbConfig);
      sinon.assert.calledOnce(fileService.saveIDB);
      sinon.assert.calledWithExactly(fileService.saveIDB, dbName, {[tableName]: newIdbConfig});

    });

  });

  describe('when dropping table', () => {

    it('should remove it from idb and save', () => {

      const idb = getIDBInstance(dbName);

      idb.dropTable(tableName);

      expect(idb.readTable(tableName)).undefined();
      sinon.assert.calledOnce(fileService.saveIDB);
      sinon.assert.calledWithExactly(fileService.saveIDB, dbName, {});

    });

  });

  describe('when updating table', () => {

    it('should update the idb and save', () => {

      const idb = getIDBInstance(dbName);
      const lastId = 2;
      const schema = {newSchema: 'String'};
      const updatedIdbConfig = {
        lastId,
        schema
      };

      idb.updateTable(tableName, schema, lastId);

      expect(idb.readTable(tableName)).equals(updatedIdbConfig);
      sinon.assert.calledOnce(fileService.saveIDB);
      sinon.assert.calledWithExactly(fileService.saveIDB, dbName, {[tableName]: updatedIdbConfig});

    });

  });

  describe('when getting table', () => {

    it('should return the schema', () => {

      const idb = getIDBInstance(dbName);

      expect(idb.readTable(tableName)).equals({
        lastId: 1,
        schema: Schema
      });

    });

  });

  describe('when closing idb', () => {

    it('should destroy the instance', () => {

      const idbInstance1 = getIDBInstance(dbName);

      closeIDB(dbName);

      expect(idbInstance1).not.shallow.equals(getIDBInstance(dbName));

    });

  });

});
