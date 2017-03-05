import {loadIDB, saveIDB} from './utilities/file';

const dbNames = new WeakMap();
const idbInstances = {};

class IDB {

  get dbName() {

    return dbNames.get(this);

  }

  constructor(dbName) {

    this.data = loadIDB(dbName);

    dbNames.set(this, dbName);

  }

  createTable(tableName, Schema) {

    this.data[tableName] = Schema;

    saveIDB(
      this.dbName,
      this.data
    );

  }

  dropTable(tableName) {

    delete this.data[tableName];

    saveIDB(
      this.dbName,
      this.data
    );

  }

  readTable(tableName) {

    return this.data[tableName];

  }

  updateTable(tableName, Schema) {

    return this.createTable(tableName, Schema);

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
