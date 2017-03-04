import {saveTable} from './utilities/file';

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

  constructor(dbName, tableName) {

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
