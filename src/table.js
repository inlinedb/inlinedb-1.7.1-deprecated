import {doesTableExist, saveTable} from './utilities/file';
import assert from 'assert';
import {errors} from './literals';
import {getIDBInstance} from './idb';
import {parse} from './utilities/schema';

const dbNames = new WeakMap();
const tableData = new WeakMap();
const tableNames = new WeakMap();
const tableSchemas = new WeakMap();

export class Table {

  get dbName() {

    return dbNames.get(this);

  }

  get tableData() {

    return tableData.get(this);

  }

  get tableName() {

    return tableNames.get(this);

  }

  constructor(dbName, tableName, Schema) {

    const defaultData = {
      index: {},
      rows: []
    };

    const tableExist = doesTableExist(dbName, tableName);

    assert(dbName, errors.DB_NAME_IS_REQUIRED);
    assert(tableName, errors.TABLE_NAME_IS_REQUIRED);
    assert(Schema || tableExist, errors.SCHEMA_NAME_IS_REQUIRED);

    dbNames.set(this, dbName);
    tableNames.set(this, tableName);
    tableData.set(this, defaultData);

    this.loadSchema(tableExist, Schema);

  }

  loadSchema(tableExist, Schema) {

    const tableName = this.tableName;
    const idb = getIDBInstance(this.dbName);

    if (tableExist) {

      tableSchemas.set(this, parse(idb.readTable(tableName)));

    } else {

      idb.createTable(tableName, Schema);
      tableSchemas.set(this, parse(Schema));

    }

    this.idb = idb;

  }

  save() {

    return new Promise((resolve, reject) => {

      saveTable(
        this.dbName,
        this.tableName,
        this.tableData,
        err => (err ? reject : resolve)()
      );

    });

  }

}
