import { idUtils } from '../src/id-utils';

describe('idUtils', () => {
	it('Should be a singleton object with expected methods', () => {
		assert.strictEqual(typeof idUtils, 'object');
		assert.strictEqual(typeof idUtils.isReal, 'function');
		assert.strictEqual(typeof idUtils.isTemplate, 'function');
		assert.strictEqual(typeof idUtils.boxTemplate, 'function');
		assert.strictEqual(typeof idUtils.unbox, 'function');
	});

	describe('isRealId()', () => {
		it('returns true for positive integers', () => {
			assert.strictEqual(idUtils.isReal(1), true);
			assert.strictEqual(idUtils.isReal(42), true);
		});

		it('returns false for zero, negative and non-integers', () => {
			assert.strictEqual(idUtils.isReal(0), false);
			assert.strictEqual(idUtils.isReal(-1), false);
			assert.strictEqual(idUtils.isReal(1.5), false);
		});

		it('handles template ids', () => {
			assert.strictEqual(idUtils.isReal('template123'), true);
			// leading zeros should still be parsed as a number ("001" -> 1)
			assert.strictEqual(idUtils.isReal('template001'), true);
			// template with zero should not be considered a real id
			assert.strictEqual(idUtils.isReal('template0'), false);
			// non-numeric template suffix is not a real id
			assert.strictEqual(idUtils.isReal('templateabc'), false);
		});
	});

	describe('isTemplate()', () => {
		it('detects template-prefixed ids', () => {
			assert.strictEqual(idUtils.isTemplate('template123'), true);
			assert.strictEqual(idUtils.isTemplate('templateabc'), true);
			assert.strictEqual(idUtils.isTemplate('abc'), false);
			assert.strictEqual(idUtils.isTemplate(123), false);
		});
	});

	describe('boxTemplate() / unbox()', () => {
		it('boxes and unboxes numeric ids', () => {
			const boxed = idUtils.boxTemplate(123);
			assert.strictEqual(boxed, 'template123');
			const unboxed = idUtils.unbox(boxed);
			assert.strictEqual(unboxed, 123);
		});

		it('boxes and unboxes string ids', () => {
			const boxed = idUtils.boxTemplate('abc');
			assert.strictEqual(boxed, 'templateabc');
			const unboxed = idUtils.unbox(boxed);
			assert.strictEqual(unboxed, 'abc');
		});
	});
});
