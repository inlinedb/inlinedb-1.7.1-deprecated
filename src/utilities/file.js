import fs from 'fs';
import {mkdirp} from 'mkdirp';

const getLocation = (dbName, tableName) => `./${dbName}/${tableName}.table`;

export const saveTable = (dbName, tableName, data, done) =>
  mkdirp(`./${dbName}`, () =>
    fs.writeFile(getLocation(dbName, tableName), JSON.stringify(data), done)
  );

export const tableExists = (dbName, tableName) => {

  try {

    return fs.statSync(getLocation(dbName, tableName)).isFile();

  } catch (e) {

    return false;

  }

};
