import {Table} from './table';
import {getIDBInstance} from './idb';

const dbNames = new WeakMap();

export class Database {

  get dbName() {

    return dbNames.get(this);

  }

  constructor(dbName) {

    dbNames.set(this, dbName);

  }

  createTable(tableName, Schema) {

    return new Table(this.dbName, tableName, Schema);

  }

  dropTable(tableName) {

    new Table(this.dbName, tableName, {}).drop();

  }

  list() {

    return Object.keys(getIDBInstance(this.dbName).config);

  }

}
