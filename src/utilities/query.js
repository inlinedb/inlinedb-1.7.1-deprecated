let id = 0;

const nextId = () => id += 1;
const getId = () => `${new Date().getTime() + nextId()}`;

const buildIndex = rows => rows.reduce((indices, row, index) => {

  indices[row.$$idbId] = index;

  return indices;

}, {});

const deleteRow = (query, data) => {

  const rows = data.rows.filter(row => !Boolean(query.filter(row)));

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

const queryExecutors = {
  delete: deleteRow,
  insert,
  update
};

export const executeQuery = (query, data) => {

  const executor = queryExecutors[query.type];

  return executor ? executor(query, data) : data;

};

export const queryTypes = {
  DELETE: 'delete',
  INSERT: 'insert',
  UPDATE: 'update'
};
