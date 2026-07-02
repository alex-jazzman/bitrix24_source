import { describe, it, beforeEach } from 'mocha';
import { assert } from 'chai';

import { withUserAgent } from './helpers';

describe('baseline/computeStatus', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('should return supported for current test browser', () => {
		const result = BX.Baseline.check();
		assert.equal(result.status, 'supported');
	});

	it('should return unsupported for IE 11', () => {
		withUserAgent('Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko', () => {
			assert.equal(BX.Baseline.check().status, 'unsupported');
		});
	});

	it('should return unsupported for Chrome below baseline', () => {
		withUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/108.0.0.0 Safari/537.36', () => {
			assert.equal(BX.Baseline.check().status, 'unsupported');
		});
	});

	it('should return supported for Chrome at baseline', () => {
		withUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/109.0.0.0 Safari/537.36', () => {
			assert.equal(BX.Baseline.check().status, 'supported');
		});
	});

	it('should return supported for Chrome above baseline', () => {
		withUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36', () => {
			assert.equal(BX.Baseline.check().status, 'supported');
		});
	});

	it('should return unsupported for Firefox below baseline', () => {
		withUserAgent('Mozilla/5.0 (Windows NT 6.1; rv:114.0) Gecko/20100101 Firefox/114.0', () => {
			assert.equal(BX.Baseline.check().status, 'unsupported');
		});
	});

	it('should return supported for Firefox at baseline', () => {
		withUserAgent('Mozilla/5.0 (Windows NT 10.0; rv:115.0) Gecko/20100101 Firefox/115.0', () => {
			assert.equal(BX.Baseline.check().status, 'supported');
		});
	});

	it('should return unsupported for Safari below baseline', () => {
		withUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15', () => {
			assert.equal(BX.Baseline.check().status, 'unsupported');
		});
	});

	it('should return supported for Safari at baseline', () => {
		withUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15', () => {
			assert.equal(BX.Baseline.check().status, 'supported');
		});
	});
});
