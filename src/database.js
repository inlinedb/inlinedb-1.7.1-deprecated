import {getIDBInstance} from './idb';

const dbNames = new WeakMap();

export class Database {

  get dbName() {

    return dbNames.get(this);

  }

  constructor(dbName) {

    dbNames.set(this, dbName);

  }

  list() {

    return Object.keys(getIDBInstance(this.dbName).config);

  }

}
