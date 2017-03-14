import {Database} from '../src/database';
import {expect} from 'code';

describe('Given Database', () => {

  const dbName = 'dbName';
  let database;

  beforeEach(() => {

    database = new Database(dbName);

  });

  it('should be constructed and used as an object', () => {

    expect(database).object();

  });

  it('should have getters', () => {

    expect(database.dbName).equals(dbName);

  });

});
