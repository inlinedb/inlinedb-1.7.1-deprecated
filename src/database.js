import {closeIDB, getIDBInstance} from './utilities/idb';
import {Table} from './table';
import assert from 'assert';
import {deleteDatabase} from './utilities/file';
import {errors} from './literals';

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

  drop() {

    deleteDatabase(this.dbName);
    closeIDB(this.dbName);

  }

  dropTable(tableName) {

    new Table(this.dbName, tableName, {}).drop();

    return this;

  }

  list() {

    return Object.keys(getIDBInstance(this.dbName).config);

  }

}
