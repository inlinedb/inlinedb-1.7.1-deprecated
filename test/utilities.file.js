import {expect} from 'code';
import fs from 'fs';
import mkdirp from 'mkdirp';
import sinon from 'sinon';
import * as fileService from '../src/utilities/file';

describe('Given file utility', () => {

  const dbName = 'dbName';
  const tableName = 'tableName';
  const tablePath = `./${dbName}/${tableName}.table`;
  const idbPath = `./${dbName}/.idb`;
  const data = {id: 'data'};
  let sandbox;

  beforeEach(() => {

    sandbox = sinon.sandbox.create();

    sandbox.stub(fs, 'readFile');
    sandbox.stub(fs, 'writeFile');
    sandbox.stub(mkdirp, 'mkdirp');

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

  describe('when saving idb', () => {

    it('should write data to the idb', () => {

      mkdirp.mkdirp.callsArg(1);

      const done = sandbox.stub;

      fileService.saveIDB(dbName, data, done);

      sinon.assert.calledOnce(mkdirp.mkdirp);
      sinon.assert.calledWithExactly(mkdirp.mkdirp, `./${dbName}`, sinon.match.func);

      sinon.assert.calledOnce(fs.writeFile);
      sinon.assert.calledWithExactly(fs.writeFile, idbPath, JSON.stringify(data), done);

    });

  });

  describe('when loading idb', () => {

    it('should read idb file', () => {

      const done = sandbox.stub();

      fileService.loadIDB(dbName, done);

      sinon.assert.calledOnce(fs.readFile);
      sinon.assert.calledWithExactly(fs.readFile, idbPath, done);

    });

  });

  describe('when checking if a table exists', () => {

    let stat;

    beforeEach(() => {

      stat = {
        isFile: sandbox.stub()
      };

      sandbox.stub(fs, 'statSync').returns(stat);

    });

    it('should get stat for the table', () => {

      fileService.tableExists(dbName, tableName);

      sinon.assert.calledOnce(fs.statSync);
      sinon.assert.calledWithExactly(fs.statSync, tablePath);

    });

    it('should return stat if it does', () => {

      stat.isFile.returns(true);

      expect(fileService.tableExists(dbName, tableName)).true();

    });

    it('should return false if it does not', () => {

      stat.isFile.throws(false);

      expect(fileService.tableExists(dbName, tableName)).false();

    });

  });

});
