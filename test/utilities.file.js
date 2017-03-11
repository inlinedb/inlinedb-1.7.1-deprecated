import {expect} from 'code';
import fs from 'fs';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import sinon from 'sinon';
import * as fileService from '../src/utilities/file';

describe('Given file utility', () => {

  const dbName = 'dbName';
  const tableName = 'tableName';
  const tablePath = `./${dbName}/${tableName}.table`;
  const idbPath = `./${dbName}/.idb`;
  const data = {id: 'data'};
  let sandbox,
    stat;

  beforeEach(() => {

    sandbox = sinon.sandbox.create();

    stat = {
      isFile: sandbox.stub()
    };

    sandbox.stub(fs, 'statSync').returns(stat);
    sandbox.stub(fs, 'readFile');
    sandbox.stub(fs, 'readFileSync');
    sandbox.stub(fs, 'writeFile');
    sandbox.stub(fs, 'writeFileSync');
    sandbox.stub(mkdirp, 'mkdirp');
    sandbox.stub(rimraf, 'sync');

  });

  afterEach(() => sandbox.restore());

  describe('when saving table', () => {

    it('should write data to the file', () => {

      mkdirp.mkdirp.callsArg(1);

      const done = sandbox.stub;

      fileService.saveTable(dbName, tableName, data, done);

      sinon.assert.calledOnce(mkdirp.mkdirp);
      sinon.assert.calledWithExactly(mkdirp.mkdirp, `./${dbName}`, sinon.match.func);

      sinon.assert.calledOnce(fs.writeFile);
      sinon.assert.calledWithExactly(fs.writeFile, tablePath, JSON.stringify(data), done);

    });

  });

  describe('when loading table', () => {

    let done;

    beforeEach(() => {

      done = sandbox.stub();

    });

    it('should read the table file', () => {

      fileService.loadTable(dbName, tableName, done);

      sinon.assert.calledOnce(fs.readFile);
      sinon.assert.calledWithExactly(fs.readFile, tablePath, sinon.match.func);

    });

    it('should call done with err', () => {

      fs.readFile.callsArgWith(1, true);

      fileService.loadTable(dbName, tableName, done);

      sinon.assert.calledOnce(done);
      sinon.assert.calledWithExactly(done, true);

    });

    it('should call done with data', () => {

      fs.readFile.callsArgWith(1, false, JSON.stringify(data));

      fileService.loadTable(dbName, tableName, done);

      sinon.assert.calledOnce(done);
      sinon.assert.calledWithExactly(done, null, data);

    });

  });

  describe('when deleting table', () => {

    it('should remove the table from system', () => {

      fileService.deleteTable(dbName, tableName);

      sinon.assert.calledOnce(rimraf.sync);
      sinon.assert.calledWithExactly(rimraf.sync, tablePath);

    });

  });

  describe('when saving idb', () => {

    it('should write data to the idb', () => {

      fileService.saveIDB(dbName, data);

      sinon.assert.calledOnce(mkdirp.mkdirp);
      sinon.assert.calledWithExactly(mkdirp.mkdirp, `./${dbName}`);

      sinon.assert.calledOnce(fs.writeFileSync);
      sinon.assert.calledWithExactly(fs.writeFileSync, idbPath, JSON.stringify(data));

    });

  });

  describe('when loading idb', () => {

    it('should read idb file if it exists', () => {

      const idbData = {[tableName]: {schema: 'schema'}};
      const idbString = JSON.stringify(idbData);

      stat.isFile.returns(true);
      fs.readFileSync.returns(idbString);

      expect(fileService.loadIDB(dbName)).equals(idbData);
      sinon.assert.calledWithExactly(fs.readFileSync, idbPath);

    });

    it('should not read idb file if it does not exist', () => {

      expect(fileService.loadIDB(dbName)).equals({});
      sinon.assert.notCalled(fs.readFileSync);

    });

  });

  describe('when checking if a table exists', () => {

    it('should get stat for the table', () => {

      fileService.doesTableExist(dbName, tableName);

      sinon.assert.calledOnce(fs.statSync);
      sinon.assert.calledWithExactly(fs.statSync, tablePath);

    });

    it('should return stat if it does', () => {

      stat.isFile.returns(true);

      expect(fileService.doesTableExist(dbName, tableName)).true();

    });

    it('should return false if it does not', () => {

      stat.isFile.throws(false);

      expect(fileService.doesTableExist(dbName, tableName)).false();

    });

  });

});
