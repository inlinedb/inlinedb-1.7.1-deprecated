import {errors} from '../src/literals';
import {expect} from 'code';
import * as schemaService from '../src/utilities/schema';

describe('Given Schema Service', () => {

  const escape = str => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

  describe('when parsing', () => {

    let Schema,
      schema;

    beforeEach(() => {

      schema = {
        bar: 'Number',
        foo: 'String'
      };

      Schema = schemaService.parse(schema);

    });

    it('should be a struct', () => {

      expect(Schema.meta.kind).equals('struct');

    });

    it('should be Schema type', () => {

      expect(Schema.meta.name).equals('Schema');

    });

    it('should allow schema in Type format', () => {

      Object.keys(schema).forEach(key => {

        const type = schema[key];

        expect(Schema.meta.props[key]).exists();
        expect(Schema.meta.props[key].meta.name).equals(type);

      });

    });

    it('should allow optional schema in Type? format', () => {

      schema.bar += '?';

      Object.keys(schema).forEach(key => {

        const type = schema[key].replace(/\?$/, '');

        expect(Schema.meta.props[key]).exists();
        expect(Schema.meta.props[key].meta.name).equals(type);

      });

    });

    it('should throw INVALID_COLUMN_TYPE on invalid Type formats', () => {

      const invalidColumnTypes = ['number', 'String??', '?Boolean', 'NUMBER'];

      invalidColumnTypes.forEach(type => {

        schema = {
          foo: type
        };

        expect(() => schemaService.parse(schema)).throws(Error, `${errors.INVALID_COLUMN_TYPE}: "${type}" for foo`);

      });

    });

  });

  describe('when validating', () => {

    describe('normally', () => {

      const Schema = schemaService.parse({
        foo: 'String'
      });

      it('should return true if rows are valid', () => {

        expect(schemaService.validate(Schema, {foo: 'bar'})).true();

      });

      it('should throw INVALID_COLUMN_VALUE if rows are invalid', () => {

        const invalidColumnValue = new RegExp(`^${escape(errors.INVALID_COLUMN_VALUE)}`);

        expect(() => schemaService.validate(Schema, {foo: 123})).throws(Error, invalidColumnValue);

      });

    });

    describe('non optional schema', () => {

      const Schema = schemaService.parse({
        bar: 'Number',
        foo: 'String'
      });

      it('should return true if rows have all schema', () => {

        expect(schemaService.validate(Schema, {
          bar: 123,
          foo: 'bar'
        })).true();

      });

      it('should throw INVALID_COLUMN_VALUE on missing column value', () => {

        const invalidColumnValue = new RegExp(`^${escape(errors.INVALID_COLUMN_VALUE)}`);

        expect(() => schemaService.validate(Schema, {foo: 123})).throws(Error, invalidColumnValue);

      });

    });

    describe('optional schema', () => {

      const Schema = schemaService.parse({
        bar: 'Number?',
        foo: 'String'
      });

      it('should return true if rows have all schema', () => {

        expect(schemaService.validate(Schema, {
          bar: 123,
          foo: 'bar'
        })).true();

      });

      it('should forgive missing column value', () => {

        expect(schemaService.validate(Schema, {
          foo: 'bar'
        })).true();

      });

    });

  });

});
