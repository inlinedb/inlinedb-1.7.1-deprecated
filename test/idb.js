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

    sandbox.stub(fileService, 'loadIDB');
    sandbox.stub(fileService, 'saveIDB');

    fileService.loadIDB.callsArgWith(1, false, '{}');

  });

  afterEach(() => {

    sandbox.restore();

    closeIDB(dbName);

  });

  it('should return a unique instance for each dbName', () => {

    const dbName1 = 'dbName1';
    const dbName2 = 'dbName2';

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
      sinon.assert.calledWithExactly(fileService.loadIDB, dbName, sinon.match.func);

    });

    it('should have resolved data if idb exists', async() => {

      const idbData = {[tableName]: Schema};

      fileService.loadIDB.callsArgWith(1, false, JSON.stringify(idbData));

      const idb = await getIDBInstance(dbName);

      expect(idb.data).equals(idbData);

    });

    it('should have empty data if idb does not exist', async() => {

      fileService.loadIDB.callsArgWith(1, true);

      const idb = await getIDBInstance(dbName);

      expect(idb.data).equals({});

    });

  });

  describe('when creating table', () => {

    it('should add it to idb and save', () => {

      const idb = getIDBInstance(dbName);
      const idbData = {[tableName]: Schema};

      fileService.saveIDB.callsArg(2);

      idb.createTable(tableName, Schema);

      sinon.assert.calledOnce(fileService.saveIDB);
      sinon.assert.calledWithExactly(fileService.saveIDB, dbName, idbData, sinon.match.func);

    });

    it('should reject on failing to save idb', async() => {

      let rejected = false;

      fileService.saveIDB.callsArgWith(2, true);

      await getIDBInstance(dbName)
        .createTable(tableName, dbName)
        .catch(() => rejected = true);

      expect(rejected).true();

    });

  });

  describe('when dropping table', () => {

    it('should remove it from idb and save', () => {

      const idb = getIDBInstance(dbName);

      idb.data = {[tableName]: Schema};

      fileService.saveIDB.callsArg(2);

      idb.dropTable(tableName);

      sinon.assert.calledOnce(fileService.saveIDB);
      sinon.assert.calledWithExactly(fileService.saveIDB, dbName, {}, sinon.match.func);

    });

  });

  describe('when updating table', () => {

    it('should update the idb and save', () => {

      const idb = getIDBInstance(dbName);
      const idbData = {[tableName]: Schema};

      fileService.saveIDB.callsArg(2);

      idb.updateTable(tableName, Schema);

      sinon.assert.calledOnce(fileService.saveIDB);
      sinon.assert.calledWithExactly(fileService.saveIDB, dbName, idbData, sinon.match.func);

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
