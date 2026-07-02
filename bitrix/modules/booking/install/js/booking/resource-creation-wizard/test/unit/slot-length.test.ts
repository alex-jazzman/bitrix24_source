import { assert } from 'chai';
import { describe, it } from 'mocha';

import {
	SlotLengthLimitWithoutMultiday,
	normalizeSlotLength,
} from '../../src/lib/slot-length.js';

describe('ResourceCreationWizard', () => {
	describe('Slot-length', () => {
		it('keeps slot length unchanged when multiday feature is available', () => {
			const slotLength = SlotLengthLimitWithoutMultiday + 60;

			assert.equal(normalizeSlotLength(slotLength, true), slotLength);
		});

		it('keeps slot length unchanged when it is within the non-multiday limit', () => {
			const slotLength = SlotLengthLimitWithoutMultiday - 60;

			assert.equal(normalizeSlotLength(slotLength, false), slotLength);
		});

		it('clamps slot length to exactly 12 hours when multiday feature is unavailable', () => {
			const slotLength = SlotLengthLimitWithoutMultiday + 60;

			assert.equal(normalizeSlotLength(slotLength, false), SlotLengthLimitWithoutMultiday);
		});
	});
});
