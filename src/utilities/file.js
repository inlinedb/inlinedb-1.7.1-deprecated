import fs from 'fs';
import {mkdirp} from 'mkdirp';

export const saveTable = (dbName, tableName, data, done) =>
  mkdirp(`./${dbName}`, () =>
    fs.writeFile(`./${dbName}/${tableName}.table`, JSON.stringify(data), done)
  );
