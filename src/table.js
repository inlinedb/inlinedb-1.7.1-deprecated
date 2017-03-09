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

const executeQueries = table => tableQueries.get(table).reduce(
  (initialData, query) => executeQuery(query, initialData),
  table.tableData
);

const loadSchema = (table, tableExist, Schema) => {

  const tableName = table.tableName;
  const idb = getIDBInstance(table.dbName);

  if (tableExist) {

    tableSchemas.set(table, parse(idb.readTable(tableName)));

  } else {

    idb.createTable(tableName, Schema);
    tableSchemas.set(table, parse(Schema));

  }

  return idb;

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

    this.idb = loadSchema(this, tableExist, Schema);

  }

  insert(...rows) {

    validate(this.tableSchema, ...rows);

    tableQueries.get(this).push({
      rows,
      type: queryTypes.INSERT
    });

  }

  save() {

    return new Promise((resolve, reject) => {

      loadTable(this.dbName, this.tableName, (error, data) => {

        tableData.set(this, error ? defaultData : data);

        const newData = executeQueries(this);

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
