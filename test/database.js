import {Database} from '../src/database';
import {expect} from 'code';
import sinon from 'sinon';
import * as idbService from '../src/idb';

describe('Given Database', () => {

  const dbName = 'dbName';
  let database,
    idbInstance,
    sandbox;

  beforeEach(() => {

    sandbox = sinon.sandbox.create();

    idbInstance = {};

    sandbox.stub(idbService, 'getIDBInstance')
      .withArgs(dbName)
      .returns(idbInstance);

    database = new Database(dbName);

  });

  afterEach(() => sandbox.restore());

  it('should be constructed and used as an object', () => {

    expect(database).object();

  });

  it('should have getters', () => {

    expect(database.dbName).equals(dbName);
    expect(database.idb).equals(idbInstance);

  });

});
