import {saveTable, tableExists} from './utilities/file';
import assert from 'assert';
import {errors} from './literals';

const dbNames = new WeakMap();
const tableData = new WeakMap();
const tableNames = new WeakMap();

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

    assert(dbName, errors.DB_NAME_IS_REQUIRED);
    assert(tableName, errors.TABLE_NAME_IS_REQUIRED);
    assert(Schema || tableExists(dbName, tableName), errors.SCHEMA_NAME_IS_REQUIRED);

    dbNames.set(this, dbName);
    tableNames.set(this, tableName);
    tableData.set(this, []);

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
