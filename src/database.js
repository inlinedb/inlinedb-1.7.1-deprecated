const dbNames = new WeakMap();

export class Database {

  get dbName() {

    return dbNames.get(this);

  }

  constructor(dbName) {

    dbNames.set(this, dbName);

  }

}
