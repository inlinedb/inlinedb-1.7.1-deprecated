import {Number, struct} from 'tcomb';

const getId = lastId => lastId + 1;

const buildIndex = rows => rows.reduce((indices, row, index) => {

  indices[row.$$idbId] = index;

  return indices;

}, {});

const getTableSchema = Schema => struct({
  $$idbId: Number,
}).extend([Schema], 'Schema');

const deleteRows = (query, data) => {

  const rows = data.rows.filter(row => !Boolean(query.filter(row)));

  return {
    index: buildIndex(rows),
    lastId: data.lastId,
    rows
  };

};

const deleteById = (query, data) => {

  const rows = data.rows.slice();
  const indices = query.ids
    .map($$idbId => data.index[$$idbId])
    .sort((a, b) => b - a);

  indices.forEach(index => rows.splice(index, 1));

  return {
    index: buildIndex(rows),
    lastId: data.lastId,
    rows
  };

};

const insert = (query, data) => {

  let lastId = data.lastId;

  const rows = data.rows.concat(
    query.rows.map(row => {

      lastId = getId(lastId);

      return {
        $$idbId: lastId,
        ...row
      };

    })
  );

  return {
    index: buildIndex(rows),
    lastId,
    rows
  };

};

const update = (query, data, Schema) => {

  const TableSchema = getTableSchema(Schema);

  const rows = data.rows.map(
    row => new TableSchema(
      query.shouldUpdate(row) ?
        query.update(new TableSchema(row)) :
        row
    )
  );

  return {
    index: data.index,
    lastId: data.lastId,
    rows
  };

};

const updateById = (query, data, Schema) => {

  const TableSchema = getTableSchema(Schema);
  const rows = data.rows.slice();

  query.ids.forEach($$idbId => {

    const index = data.index[$$idbId];
    const row = new TableSchema(rows[index]);

    rows[index] = new TableSchema(query.update(row));

  });

  return {
    index: data.index,
    lastId: data.lastId,
    rows
  };

};

const queryExecutors = {
  deleteById,
  deleteRows,
  insert,
  update,
  updateById
};

export const executeQuery = (query, data, Schema) => {

  const executor = queryExecutors[query.type];

  return executor ? executor(query, data, Schema) : data;

};

export const queryTypes = {
  DELETE_BY_ID: 'deleteById',
  DELETE_ROWS: 'deleteRows',
  INSERT: 'insert',
  UPDATE: 'update',
  UPDATE_BY_ID: 'updateById'
};
