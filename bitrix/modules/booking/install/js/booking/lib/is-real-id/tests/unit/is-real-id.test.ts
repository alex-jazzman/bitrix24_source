import { describe, it } from 'mocha';
import { assert } from 'chai';

import { isRealId } from '../../src/is-real-id.js';

describe('isRealId', () => {
	describe('with number', () => {
		it('returns false for a negative number', () => {
			assert.isFalse(isRealId(-11653));
		});

		it('returns true for a positive number', () => {
			assert.isTrue(isRealId(155));
		});
	});

	describe('with string', () => {
		it('returns false for a negative numeric string', () => {
			assert.isFalse(isRealId('-1467'));
		});

		it('returns false for a non-numeric string', () => {
			assert.isFalse(isRealId('Test278'));
		});

		it('returns true for a positive numeric string', () => {
			assert.isTrue(isRealId('278'));
		});
	});
});
