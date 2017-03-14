import {getIDBInstance} from './idb';

const dbNames = new WeakMap();
const idbConfig = new WeakMap();

export class Database {

  get dbName() {

    return dbNames.get(this);

  }

  get config() {

    return idbConfig.get(this);

  }

  constructor(dbName) {

    dbNames.set(this, dbName);
    idbConfig.set(this, getIDBInstance(dbName).config);

  }

  list() {

    return Object.keys(this.config);

  }

}