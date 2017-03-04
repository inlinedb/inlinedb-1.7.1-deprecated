import {Table} from '../src/table';
import {expect} from 'code';

describe('Given Table', () => {

  let table;

  beforeEach(() => {

    table = new Table();

  });

  it('should be constructed and used as an object', () => {

    expect(table).object();

  });

});
