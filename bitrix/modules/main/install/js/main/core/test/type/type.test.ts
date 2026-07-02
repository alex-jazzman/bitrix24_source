import Type from '../../src/lib/type';

describe('core/type', () => {
	describe('isStringFilled', () => {
		it('rejects everything except strings', () => {
			assert(Type.isStringFilled(true) === false);
			assert(Type.isStringFilled(false) === false);
			assert(Type.isStringFilled([]) === false);
			assert(Type.isStringFilled([1, 2]) === false);
			assert(Type.isStringFilled({}) === false);
			assert(Type.isStringFilled(1) === false);
		});

		it('rejects an empty string', () => {
			assert(Type.isStringFilled('') === false);
		});

		it('accepts a none-empty string', () => {
			assert(Type.isStringFilled('123') === true);
			assert(Type.isStringFilled(' ') === true);
			assert(Type.isStringFilled('0') === true);
		});
	});

	describe('isArrayFilled', () => {
		it('rejects everything except array', () => {
			assert(Type.isArrayFilled(true) === false);
			assert(Type.isArrayFilled(false) === false);
			assert(Type.isArrayFilled({}) === false);
			assert(Type.isArrayFilled(1) === false);
			assert(Type.isArrayFilled('123') === false);
		});

		it('rejects an empty array', () => {
			assert(Type.isArrayFilled([]) === false);
		});

		it('accepts a none-empty array', () => {
			assert(Type.isArrayFilled([1]) === true);
			assert(Type.isArrayFilled([1, 2]) === true);
			assert(Type.isArrayFilled(['']) === true);
		});
	});

	describe('isPlainObject', () => {
		it('accepts an empty object', () => {
			assert(Type.isPlainObject({}) === true);
		});

		it('accepts an object with nullable prototype', () => {
			assert(Type.isPlainObject(Object.create(null)) === true);
		});

		it('accepts an regular non-empty object', () => {
			assert(Type.isPlainObject({ a: 1, b: 2 }) === true);
		});

		it('rejects a function', () => {
			assert(Type.isPlainObject(() => {}) === false);
		});

		it('rejects a boolean value', () => {
			assert(Type.isPlainObject(true) === false);
		});

		it('rejects an undefined value', () => {
			assert(Type.isPlainObject() === false);
			assert(Type.isPlainObject() === false);
		});

		it('rejects a null value', () => {
			assert(Type.isPlainObject(null) === false);
		});

		it('rejects an instance', () => {
			assert(Type.isPlainObject(new function() { this.a = 1; }()) === false);
			assert(Type.isPlainObject(new Type()) === false);
		});
	});

	describe('Type.isEventTargetLike', () => {
		it('should return true for a real EventTarget instance', () => {
			const eventTarget = new EventTarget();
			assert.strictEqual(Type.isEventTargetLike(eventTarget), true);
		});

		it('should return true for an object with all required methods', () => {
			const mockEventTarget = {
				addEventListener: () => {},
				removeEventListener: () => {},
				dispatchEvent: () => {},
			};
			assert.strictEqual(Type.isEventTargetLike(mockEventTarget), true);
		});

		it('should return true for an object with methods defined on prototype', () => {
			function MockEventTarget()
			{}

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
			MockEventTarget.prototype.addEventListener = () => {};

			// eslint-disable-next-line @bitrix24/bitrix24-rules/no-native-events-binding
			MockEventTarget.prototype.removeEventListener = () => {};

			MockEventTarget.prototype.dispatchEvent = () => {};

			const instance = new MockEventTarget();
			assert.strictEqual(Type.isEventTargetLike(instance), true);
		});

		it('should return false for null', () => {
			assert.strictEqual(Type.isEventTargetLike(null), false);
		});

		it('should return false for undefined', () => {
			assert.strictEqual(Type.isEventTargetLike(undefined), false);
		});

		it('should return false for a plain object without required methods', () => {
			const plainObj = {};
			assert.strictEqual(Type.isEventTargetLike(plainObj), false);
		});

		it('should return false for a string', () => {
			assert.strictEqual(Type.isEventTargetLike('string'), false);
		});

		it('should return false for a number', () => {
			assert.strictEqual(Type.isEventTargetLike(42), false);
		});

		it('should return false for an array', () => {
			assert.strictEqual(Type.isEventTargetLike([]), false);
		});

		it('should return false for an object with only addEventListener', () => {
			const partialObj = {
				addEventListener: () => {},
			};
			assert.strictEqual(Type.isEventTargetLike(partialObj), false);
		});

		it('should return false for an object with only removeEventListener', () => {
			const partialObj = {
				removeEventListener: () => {},
			};
			assert.strictEqual(Type.isEventTargetLike(partialObj), false);
		});

		it('should return false for an object with only dispatchEvent', () => {
			const partialObj = {
				dispatchEvent: () => {},
			};
			assert.strictEqual(Type.isEventTargetLike(partialObj), false);
		});

		it('should return false for an object with addEventListener and removeEventListener but no dispatchEvent', () => {
			const partialObj = {
				addEventListener: () => {},
				removeEventListener: () => {},
			};
			assert.strictEqual(Type.isEventTargetLike(partialObj), false);
		});

		it('should return false for an object with methods that are not functions', () => {
			const invalidObj = {
				addEventListener: 'not a function',
				removeEventListener: 'not a function',
				dispatchEvent: 'not a function',
			};
			assert.strictEqual(Type.isEventTargetLike(invalidObj), false);
		});
	});
});
