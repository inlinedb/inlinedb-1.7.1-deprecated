import fs from 'fs';
import {mkdirp} from 'mkdirp';

const getIDBLocation = dbName => `./${dbName}/.idb`;
const getTableLocation = (dbName, tableName) => `./${dbName}/${tableName}.table`;

const fileExists = location => {

  try {

    return fs.statSync(location).isFile();

  } catch (e) {

    return false;

  }

};

export const doesTableExist = (dbName, tableName) =>
  fileExists(getTableLocation(dbName, tableName));

export const loadIDB = dbName => {

  const location = getIDBLocation(dbName);

  if (fileExists(location)) {

    const data = fs.readFileSync(location).toString();

    return JSON.parse(data);

  }

  return {};

};

export const saveIDB = (dbName, idbData) => {

  mkdirp(`./${dbName}`);

  fs.writeFileSync(getIDBLocation(dbName), JSON.stringify(idbData));

};

export const saveTable = (dbName, tableName, data, done) =>
  mkdirp(`./${dbName}`, () =>
    fs.writeFile(getTableLocation(dbName, tableName), JSON.stringify(data), done)
  );
