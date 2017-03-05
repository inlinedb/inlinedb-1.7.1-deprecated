import assert from 'assert';
import {errors} from '../literals';
import t from 'tcomb';
import {validate as tValidate} from 'tcomb-validation';

function parseType(type) {

  const optional = /\?$/;
  let Type;

  if (optional.test(type)) {

    type = type.replace(optional, '');
    Type = t.maybe(t[type]);

  } else {

    Type = t[type];

  }

  assert(t[type]);

  return Type;

}

export function parse(schema) {

  const Schema = {};

  Object.keys(schema).forEach(column => {

    const type = schema[column];

    try {

      Schema[column] = parseType(type);

    } catch (e) {

      throw new Error(`${errors.INVALID_COLUMN_TYPE}: "${type}" for ${column}`);

    }

  });

  return t.struct(Schema, 'Schema');

}

export function validate(Schema, ...rows) {

  const Row = t.list(Schema);
  const result = tValidate(rows, Row, {strict: true});

  if (!result.isValid()) {

    const errorMessages = result.errors.reduce((m, e) => `${m}${e.message}\n`, '');
    const invalidColumnValue = `${errors.INVALID_COLUMN_VALUE}:\n${errorMessages}`;

    throw new Error(invalidColumnValue);

  }

  return true;

}
