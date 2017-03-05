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

export const loadIDB = (dbName, done) => fs.readFile(getIDBLocation(dbName), done);
export const doesTableExist = (dbName, tableName) => fileExists(getTableLocation(dbName, tableName));

export const saveIDB = (dbName, idbData, done) =>
  mkdirp(`./${dbName}`, () =>
    fs.writeFile(getIDBLocation(dbName), JSON.stringify(idbData), done)
  );

export const saveTable = (dbName, tableName, data, done) =>
  mkdirp(`./${dbName}`, () =>
    fs.writeFile(getTableLocation(dbName, tableName), JSON.stringify(data), done)
  );
