import t from 'tcomb';

const IDBConfig = t.struct({
  lastId: t.Number,
  schema: t.Object
});

const OutputData = t.struct({
  lastId: t.Number,
  rows: t.Array
});

const QueryData = t.struct({
  index: t.Object,
  lastId: t.Number,
  rows: t.Array
});

const SaveData = t.struct({
  index: t.Object,
  rows: t.Array
});

export const errors = {
  DB_NAME_IS_REQUIRED: 'Database name is required',
  INVALID_COLUMN_TYPE: 'Invalid column type given',
  INVALID_COLUMN_VALUE: 'Invalid column value(s) given',
  INVALID_UPDATE_FUNCTION: 'Invalid `update` provided. Expected a function',
  SCHEMA_NAME_IS_REQUIRED: 'Schema is required when defining table for the first time',
  TABLE_NAME_IS_REQUIRED: 'Table name is required',
};

export const types = {
  IDBConfig,
  OutputData,
  QueryData,
  SaveData
};
