(() => {
	const require = (ext) => jn.require(ext);

	const { describe, test, expect } = require('testing');
	const { pickBy, omitBy } = require('utils/object');

	describe('pickBy', () => {
		test('should pick properties by predicate', () => {
			const object = { a: 1, b: null, c: 'test', d: undefined, e: 0 };

			const result = pickBy(object, (value) => value !== null);

			expect(result).toEqual({ a: 1, c: 'test', d: undefined, e: 0 });
		});

		test('should use Boolean as default predicate', () => {
			const object = { a: 1, b: null, c: '', d: 'test', e: 0, f: false };

			const result = pickBy(object);

			expect(result).toEqual({ a: 1, d: 'test' });
		});

		test('should return empty object for null input', () => {
			expect(pickBy(null)).toEqual({});
		});

		test('should pass key as second argument to predicate', () => {
			const object = { foo: 1, bar: 2, baz: 3 };

			const result = pickBy(object, (value, key) => key.startsWith('b'));

			expect(result).toEqual({ bar: 2, baz: 3 });
		});

		test('should return empty object when no properties match', () => {
			const object = { a: 1, b: 2, c: 3 };

			const result = pickBy(object, (value) => value > 10);

			expect(result).toEqual({});
		});

		test('should return all properties when all match', () => {
			const object = { a: 1, b: 2, c: 3 };

			const result = pickBy(object, (value) => value > 0);

			expect(result).toEqual({ a: 1, b: 2, c: 3 });
		});

		test('should work with empty object', () => {
			expect(pickBy({})).toEqual({});
			expect(pickBy({}, () => true)).toEqual({});
		});
	});

	describe('omitBy', () => {
		test('should omit properties by predicate', () => {
			const object = { a: 1, b: null, c: 'test', d: undefined, e: 0 };

			const result = omitBy(object, (value) => value === null);

			expect(result).toEqual({ a: 1, c: 'test', d: undefined, e: 0 });
		});

		test('should use Boolean as default predicate (omit truthy)', () => {
			const object = { a: 1, b: null, c: '', d: 'test', e: 0, f: false };

			const result = omitBy(object);

			expect(result).toEqual({ b: null, c: '', e: 0, f: false });
		});

		test('should return empty object for null input', () => {
			expect(omitBy(null)).toEqual({});
		});

		test('should pass key as second argument to predicate', () => {
			const object = { foo: 1, bar: 2, baz: 3 };

			const result = omitBy(object, (value, key) => key.startsWith('b'));

			expect(result).toEqual({ foo: 1 });
		});

		test('should return all properties when no match', () => {
			const object = { a: 1, b: 2, c: 3 };

			const result = omitBy(object, (value) => value > 10);

			expect(result).toEqual({ a: 1, b: 2, c: 3 });
		});

		test('should return empty object when all match', () => {
			const object = { a: 1, b: 2, c: 3 };

			const result = omitBy(object, (value) => value > 0);

			expect(result).toEqual({});
		});

		test('should work with empty object', () => {
			expect(omitBy({})).toEqual({});
			expect(omitBy({}, () => true)).toEqual({});
		});
	});

	describe('pickBy and omitBy are complementary', () => {
		test('pickBy and omitBy should be inverse operations', () => {
			const object = { a: 1, b: null, c: 'test', d: undefined };
			const predicate = (value) => value !== null && value !== undefined;

			const picked = pickBy(object, predicate);
			const omitted = omitBy(object, predicate);

			expect(picked).toEqual({ a: 1, c: 'test' });
			expect(omitted).toEqual({ b: null, d: undefined });

			const combined = { ...picked, ...omitted };
			expect(combined).toEqual(object);
		});
	});
})();
