import {Table} from './table';
import assert from 'assert';
import {errors} from './literals';
import {getIDBInstance} from './utilities/idb';

const dbNames = new WeakMap();

export class Database {

  get dbName() {

    return dbNames.get(this);

  }

  constructor(dbName) {

    assert(dbName, errors.DB_NAME_IS_REQUIRED);

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
