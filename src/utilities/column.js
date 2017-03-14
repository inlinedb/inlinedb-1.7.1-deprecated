import assert from 'assert';
import {errors} from '../literals';
import {getIDBInstance} from './idb';
import {parse} from './schema';

export const updateColumn = (table, tableSchemas, schema, update) => {

  tableSchemas.set(table, parse(schema));

  table.update(update);

  return table.save();

};

export const alterColumn = (table, tableSchemas, column, type, update) => {

  assert(column, errors.INVALID_COLUMN_NAME);
  assert(type, errors.INVALID_COLUMN_TYPE);

  const idbInstance = getIDBInstance(table.dbName);
  const {schema} = idbInstance.readTable(table.tableName);

  schema[column] = type;

  return updateColumn(table, tableSchemas, schema, update);

};
