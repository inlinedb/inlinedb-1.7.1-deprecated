import fs from 'fs';
import {mkdirp} from 'mkdirp';
import rimraf from 'rimraf';

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

export const deleteTable = (dbName, tableName) =>
  rimraf.sync(getTableLocation(dbName, tableName));

export const loadTable = (dbName, tableName, done) =>
  fs.readFile(
    getTableLocation(dbName, tableName),
    (err, data) => err ? done(err) : done(null, JSON.parse(data.toString()))
  );

export const saveTable = (dbName, tableName, data, done) =>
  mkdirp(`./${dbName}`, () =>
    fs.writeFile(getTableLocation(dbName, tableName), JSON.stringify(data), done)
  );

export const deleteDatabase = dbName =>
  rimraf.sync(`./${dbName}`);
