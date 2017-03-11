import {loadIDB, saveIDB} from './utilities/file';

const dbNames = new WeakMap();
const idbConfigs = new WeakMap();
const idbInstances = {};

class IDB {

  get dbName() {

    return dbNames.get(this);

  }

  constructor(dbName) {

    idbConfigs.set(this, loadIDB(dbName));

    dbNames.set(this, dbName);

  }

  createTable(tableName, schema, lastId = 0) {

    const config = idbConfigs.get(this);

    config[tableName] = {
      lastId,
      schema
    };

    saveIDB(
      this.dbName,
      config
    );

  }

  dropTable(tableName) {

    const config = idbConfigs.get(this);

    delete config[tableName];

    saveIDB(
      this.dbName,
      config
    );

  }

  readTable(tableName) {

    return idbConfigs.get(this)[tableName];

  }

  updateTable(tableName, schema, lastId) {

    return this.createTable(tableName, schema, lastId);

  }

}

export const getIDBInstance = dbName => {

  let instance = idbInstances[dbName];

  if (!instance) {

    instance = new IDB(dbName);

    idbInstances[dbName] = instance;

  }

  return instance;

};

export const closeIDB = dbName => {

  let instance = idbInstances[dbName];

  dbNames.delete(instance);

  instance = null;

  delete idbInstances[dbName];

};
