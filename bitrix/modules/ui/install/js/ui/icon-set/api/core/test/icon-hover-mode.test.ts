import { IconHoverMode } from '../src/index';

describe('IconHoverMode', () => {
	it('should have DEFAULT and ALT values', () => {
		assert.equal(IconHoverMode.DEFAULT, 'default');
		assert.equal(IconHoverMode.ALT, 'alt');
	});

	it('should have exactly 2 entries', () => {
		assert.equal(Object.keys(IconHoverMode).length, 2);
	});

	it('should be frozen', () => {
		assert.ok(Object.isFrozen(IconHoverMode));
	});
});
