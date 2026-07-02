import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';

import './helpers';

describe('baseline/Baseline', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	describe('check', () => {
		it('should return object with status and browser', () => {
			const result = BX.Baseline.check();
			assert.property(result, 'status');
			assert.property(result, 'browser');
			assert.include(['supported', 'unsupported'], result.status);
		});

		it('should detect current browser', () => {
			const result = BX.Baseline.check();
			assert.isNotNull(result.browser);
			assert.isString(result.browser!.name);
			assert.isNumber(result.browser!.version);
		});
	});

	describe('isSupported', () => {
		it('should return a boolean', () => {
			assert.isBoolean(BX.Baseline.isSupported());
		});

		it('should return true for current browser', () => {
			assert.isTrue(BX.Baseline.isSupported());
		});
	});

	describe('detectBrowser', () => {
		it('should return browser info', () => {
			const browser = BX.Baseline.detectBrowser();
			assert.isNotNull(browser);
			assert.isString(browser!.name);
			assert.isNumber(browser!.version);
		});
	});
});
