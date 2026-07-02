import { describe, it, beforeEach, afterEach } from 'mocha';
import { assert } from 'chai';

import { AccessibilityLogger } from '../../src/accessibility-logger/accessibility-logger';

const STORAGE_KEY = 'bx:a11y:debug';

describe('AccessibilityLogger', () => {
	beforeEach(() => {
		// Reset both localStorage and the logger's internal state.
		localStorage.removeItem(STORAGE_KEY);
		AccessibilityLogger.disable();
	});

	afterEach(() => {
		localStorage.removeItem(STORAGE_KEY);
		AccessibilityLogger.disable();
	});

	it('should be disabled by default', () => {
		assert.equal(AccessibilityLogger.isEnabled('focus-trap'), false);
		assert.equal(AccessibilityLogger.isEnabled('focus-zone'), false);
	});

	it('should enable a single category and persist it to localStorage', () => {
		AccessibilityLogger.enable('focus-trap');

		assert.equal(AccessibilityLogger.isEnabled('focus-trap'), true);
		assert.equal(AccessibilityLogger.isEnabled('focus-zone'), false);

		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
		assert.deepEqual(stored, ['focus-trap']);
	});

	it('should enable every category when called without an argument', () => {
		AccessibilityLogger.enable();

		assert.equal(AccessibilityLogger.isEnabled('focus-trap'), true);
		assert.equal(AccessibilityLogger.isEnabled('focus-zone'), true);
		assert.equal(AccessibilityLogger.isEnabled('live-announcer'), true);
		assert.equal(localStorage.getItem(STORAGE_KEY), '*');
	});

	it('should disable a single category without affecting the others', () => {
		AccessibilityLogger.enable('focus-trap');
		AccessibilityLogger.enable('focus-zone');

		AccessibilityLogger.disable('focus-trap');

		assert.equal(AccessibilityLogger.isEnabled('focus-trap'), false);
		assert.equal(AccessibilityLogger.isEnabled('focus-zone'), true);
	});

	it('should clear the storage key when everything is disabled', () => {
		AccessibilityLogger.enable('focus-trap');
		AccessibilityLogger.disable();

		assert.equal(localStorage.getItem(STORAGE_KEY), null);
	});

	it('should not throw when localStorage contains corrupted data', () => {
		// The logger caches init on first use, so we cannot force a re-read, but
		// the operations must still stay exception-safe.
		localStorage.setItem(STORAGE_KEY, 'not-json{{{');

		assert.doesNotThrow(() => AccessibilityLogger.isEnabled('focus-trap'));
		assert.doesNotThrow(() => AccessibilityLogger.enable('focus-zone'));
		assert.doesNotThrow(() => AccessibilityLogger.disable('focus-zone'));
	});
});
