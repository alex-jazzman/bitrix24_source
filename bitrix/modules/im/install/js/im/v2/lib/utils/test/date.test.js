import { Type } from 'main.core';

import 'im.v2.test';
import { Utils } from 'im.v2.lib.utils';

describe('Utils.date', () => {
	describe('formatMediaDurationTime', () => {
		it('function exists', () => {
			assert(Type.isFunction(Utils.date.formatMediaDurationTime));
		});

		it('should handle zero seconds', () => {
			const result = Utils.date.formatMediaDurationTime(0);
			assert.equal(result, '00:00');
		});

		it('should pad single digit seconds', () => {
			const result = Utils.date.formatMediaDurationTime(9);
			assert.equal(result, '00:09');
		});

		it('should format seconds only', () => {
			const result = Utils.date.formatMediaDurationTime(45);
			assert.equal(result, '00:45');
		});

		it('should format minutes and seconds', () => {
			const result = Utils.date.formatMediaDurationTime(125);
			assert.equal(result, '02:05');
		});

		it('should format hours, minutes and seconds', () => {
			const result = Utils.date.formatMediaDurationTime(3665);
			assert.equal(result, '1:01:05');
		});

		it('should not pad minutes for 2 digit case', () => {
			const result = Utils.date.formatMediaDurationTime(720);
			assert.equal(result, '12:00');
		});

		it('should pad single digit minutes when hours are present', () => {
			const result = Utils.date.formatMediaDurationTime(3609);
			assert.equal(result, '1:00:09');
		});
	});
});
