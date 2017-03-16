import {expect} from 'code';
import fs from 'fs';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import sinon from 'sinon';
import zlib from 'zlib';
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
    sandbox.stub(zlib, 'gzip');
    sandbox.stub(zlib, 'unzip');

  });

  afterEach(() => sandbox.restore());

  describe('when saving table', () => {

    let done;

    beforeEach(() => done = sandbox.stub());

    it('should create the directory', () => {

      fileService.saveTable(dbName, tableName, data, done);

      sinon.assert.calledOnce(mkdirp.mkdirp);
      sinon.assert.calledWithExactly(mkdirp.mkdirp, `./${dbName}`, sinon.match.func);

    });

    it('should call done with error if failed to create directory', () => {

      mkdirp.mkdirp.callsArgWith(1, 'create directory error');

      fileService.saveTable(dbName, tableName, data, done);

      sinon.assert.calledOnce(done);
      sinon.assert.calledWithExactly(done, 'create directory error');

    });

    it('should compress the data', () => {

      mkdirp.mkdirp.callsArgWith(1, false);

      fileService.saveTable(dbName, tableName, data, done);

      sinon.assert.calledOnce(zlib.gzip);
      sinon.assert.calledWithExactly(zlib.gzip, JSON.stringify(data), sinon.match.func);

    });

    it('should call done with error if failed to compress data', () => {

      mkdirp.mkdirp.callsArgWith(1, false);
      zlib.gzip.callsArgWith(1, 'compression error');

      fileService.saveTable(dbName, tableName, data, done);

      sinon.assert.calledOnce(done);
      sinon.assert.calledWithExactly(done, 'compression error');

    });

    it('should write the compressed data to the file', () => {

      const compressedData = 'compressedData';

      mkdirp.mkdirp.callsArg(1);
      zlib.gzip.callsArgWith(1, false, compressedData);

      fileService.saveTable(dbName, tableName, data, done);

      sinon.assert.calledOnce(fs.writeFile);
      sinon.assert.calledWithExactly(fs.writeFile, tablePath, compressedData, done);

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

    it('should call done with error if failed to read', () => {

      fs.readFile.callsArgWith(1, 'read file error');

      fileService.loadTable(dbName, tableName, done);

      sinon.assert.calledOnce(done);
      sinon.assert.calledWithExactly(done, 'read file error');

    });

    it('should decompress the data', () => {

      const compressedData = 'compressedData';

      fs.readFile.callsArgWith(1, false, compressedData);

      fileService.loadTable(dbName, tableName, done);

      sinon.assert.calledOnce(zlib.unzip);
      sinon.assert.calledWithExactly(zlib.unzip, compressedData, sinon.match.func);

    });

    it('should call done with error if failed to decompress', () => {

      fs.readFile.callsArgWith(1, false);
      zlib.unzip.callsArgWith(1, 'compression error');

      fileService.loadTable(dbName, tableName, done);

      sinon.assert.calledOnce(done);
      sinon.assert.calledWithExactly(done, 'compression error');

    });

    it('should call done with parsed data', () => {

      fs.readFile.callsArgWith(1, false);
      zlib.unzip.callsArgWith(1, false, JSON.stringify(data));

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

  describe('when deleting database', () => {

    it('should remove the base folder from system', () => {

      fileService.deleteDatabase(dbName);

      sinon.assert.calledOnce(rimraf.sync);
      sinon.assert.calledWithExactly(rimraf.sync, `./${dbName}`);

    });

  });

});
