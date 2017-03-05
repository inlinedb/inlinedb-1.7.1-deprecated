import {closeIDB, getIDBInstance} from '../src/idb';
import {expect} from 'code';
import sinon from 'sinon';
import * as fileService from '../src/utilities/file';

describe('Given IDB', () => {

  const Schema = {schema: 'schema'};
  const dbName = 'dbName';
  const tableName = 'tableName';
  let sandbox;

  beforeEach(() => {

    sandbox = sinon.sandbox.create();

    sandbox.stub(fileService, 'loadIDB').returns({});
    sandbox.stub(fileService, 'saveIDB');

  });

  afterEach(() => {

    sandbox.restore();

    closeIDB(dbName);

  });

  it('should return a unique instance for each dbName', () => {

    const dbName1 = 'dbName1';
    const dbName2 = 'dbName2';

    fileService.loadIDB
      .onFirstCall().returns({})
      .onSecondCall().returns({});

    const idbInstance1 = getIDBInstance(dbName1);
    const idbInstance2 = getIDBInstance(dbName2);

    idbInstance1.createTable('tableName1', {});
    idbInstance2.createTable('tableName2', {});

    expect(idbInstance1).equals(getIDBInstance(dbName1));
    expect(idbInstance2).equals(getIDBInstance(dbName2));
    expect(idbInstance1).not.equals(getIDBInstance(dbName2));

    closeIDB(dbName1);
    closeIDB(dbName2);

  });

  describe('when instantiating', () => {

    it('should load idb', () => {

      getIDBInstance(dbName);

      sinon.assert.calledOnce(fileService.loadIDB);
      sinon.assert.calledWithExactly(fileService.loadIDB, dbName);

    });

    it('should have resolved data if idb exists', () => {

      const idbData = {[tableName]: Schema};

      fileService.loadIDB.returns(idbData);

      const idb = getIDBInstance(dbName);

      expect(idb.data).equals(idbData);

    });

  });

  describe('when creating table', () => {

    it('should add it to idb and save', () => {

      const idbData = {[tableName]: Schema};
      const idb = getIDBInstance(dbName);

      idb.createTable(tableName, Schema);

      expect(idb.data).equals(idbData);
      sinon.assert.calledOnce(fileService.saveIDB);
      sinon.assert.calledWithExactly(fileService.saveIDB, dbName, idbData);

    });

  });

  describe('when dropping table', () => {

    it('should remove it from idb and save', () => {

      const idbData = {[tableName]: Schema};
      const idb = getIDBInstance(dbName);

      idb.data = idbData;

      idb.dropTable(tableName);

      expect(idb.data).equals({});
      sinon.assert.calledOnce(fileService.saveIDB);
      sinon.assert.calledWithExactly(fileService.saveIDB, dbName, {});

    });

  });

  describe('when updating table', () => {

    it('should update the idb and save', () => {

      const idbData = {[tableName]: Schema};
      const idb = getIDBInstance(dbName);

      idb.updateTable(tableName, Schema);

      expect(idb.data).equals(idbData);
      sinon.assert.calledOnce(fileService.saveIDB);
      sinon.assert.calledWithExactly(fileService.saveIDB, dbName, idbData);

    });

  });

  describe('when getting table', () => {

    it('should return the schema', () => {

      const idb = getIDBInstance(dbName);

      idb.data = {[tableName]: Schema};

      expect(idb.readTable(tableName)).equals(Schema);

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
