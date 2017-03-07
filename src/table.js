import {doesTableExist, loadTable, saveTable} from './utilities/file';
import {executeQuery, queryTypes} from './utilities/query';
import {parse, validate} from './utilities/schema';
import assert from 'assert';
import {errors} from './literals';
import {getIDBInstance} from './idb';

const dbNames = new WeakMap();
const tableData = new WeakMap();
const tableNames = new WeakMap();
const tableQueries = new WeakMap();
const tableSchemas = new WeakMap();

const defaultData = {
  index: {},
  rows: []
};

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

  get tableSchema() {

    return tableSchemas.get(this);

  }

  constructor(dbName, tableName, Schema) {

    const tableExist = doesTableExist(dbName, tableName);

    assert(dbName, errors.DB_NAME_IS_REQUIRED);
    assert(tableName, errors.TABLE_NAME_IS_REQUIRED);
    assert(Schema || tableExist, errors.SCHEMA_NAME_IS_REQUIRED);

    dbNames.set(this, dbName);
    tableNames.set(this, tableName);
    tableData.set(this, defaultData);
    tableQueries.set(this, []);

    this.loadSchema(tableExist, Schema);

  }

  executeQueries() {

    return tableQueries.get(this).reduce(
      (initialData, query) => executeQuery(query, initialData),
      this.tableData
    );

  }

  insert(...rows) {

    validate(this.tableSchema, ...rows);

    tableQueries.get(this).push({
      rows,
      type: queryTypes.INSERT
    });

  }

  async loadSchema(tableExist, Schema) {

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

      loadTable(this.dbName, this.tableName, (error, data) => {

        tableData.set(this, error ? defaultData : data);

        const newData = this.executeQueries();

        const update = () => {

          tableData.set(this, newData);

          resolve();

        };

        return saveTable(
          this.dbName,
          this.tableName,
          newData,
          err => (err ? reject : update)()
        );

      });

    });

  }

}
