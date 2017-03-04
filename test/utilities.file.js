import fs from 'fs';
import mkdirp from 'mkdirp';
import sinon from 'sinon';
import * as fileService from '../src/utilities/file';

describe('Given file utility', () => {

  const dbName = 'dbName';
  const tableName = 'tableName';
  const data = {id: 'data'};
  let sandbox;

  beforeEach(() => {

    sandbox = sinon.sandbox.create();

    sandbox.stub(fs, 'writeFile');
    sandbox.stub(mkdirp, 'mkdirp', (dirName, callback) => callback());

  });

  afterEach(() => sandbox.restore());

  it('should save table', () => {

    const done = sandbox.stub;

    fileService.saveTable(dbName, tableName, data, done);

    sinon.assert.calledOnce(mkdirp.mkdirp);
    sinon.assert.calledWithExactly(mkdirp.mkdirp, `./${dbName}`, sinon.match.func);

    sinon.assert.calledOnce(fs.writeFile);
    sinon.assert.calledWithExactly(fs.writeFile, `./${dbName}/${tableName}.table`, JSON.stringify(data), done);

  });

});
