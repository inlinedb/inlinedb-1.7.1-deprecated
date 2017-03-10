let id = 0;

const nextId = () => id += 1;
const getId = () => `${new Date().getTime() + nextId()}`;

const buildIndex = rows => rows.reduce((indices, row, index) => {

  indices[row.$$idbId] = index;

  return indices;

}, {});

const deleteRows = (query, data) => {

  const rows = data.rows.filter(row => !Boolean(query.filter(row)));

  return {
    index: buildIndex(rows),
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
    rows
  };

};

const insert = (query, data) => {

  const rows = data.rows.concat(
    query.rows.map(row => ({
      $$idbId: getId(),
      ...row
    }))
  );

  return {
    index: buildIndex(rows),
    rows
  };

};

const update = (query, data) => {

  const rows = data.rows.map(
    row =>
      query.shouldUpdate(row) ?
        query.update(row) :
        row
  );

  return {
    index: data.index,
    rows
  };

};

const updateById = (query, data) => {

  const rows = data.rows.slice();

  query.ids.forEach($$idbId => {

    const index = data.index[$$idbId];

    rows[index] = query.update(rows[index]);

  });

  return {
    index: data.index,
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

export const executeQuery = (query, data) => {

  const executor = queryExecutors[query.type];

  return executor ? executor(query, data) : data;

};

export const queryTypes = {
  DELETE_BY_ID: 'deleteById',
  DELETE_ROWS: 'deleteRows',
  INSERT: 'insert',
  UPDATE: 'update',
  UPDATE_BY_ID: 'updateById'
};
