import {loadIDB, saveIDB} from './utilities/file';

const dbNames = new WeakMap();
const idbInstances = {};

const load = dbName =>
  new Promise(
    resolve => loadIDB(
      dbName,
      (err, result) => {

        let data = {};

        if (!err) {

          data = JSON.parse(result.toString());

        }

        resolve(data);

      }
    )
  );

const save = (dbName, data) =>
  new Promise(
    (resolve, reject) =>
      saveIDB(
        dbName,
        data,
        err => (err ? reject : resolve)()
      )
  );

class IDB {

  get dbName() {

    return dbNames.get(this);

  }

  constructor(dbName) {

    this.data = {};

    load(dbName).then(
      data => this.data = Object.assign(
        {},
        this.data,
        data
      )
    );

    dbNames.set(this, dbName);

  }

  createTable(tableName, Schema) {

    this.data[tableName] = Schema;

    return save(this.dbName, this.data);

  }

  dropTable(tableName) {

    delete this.data[tableName];

    return save(this.dbName, this.data);

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
