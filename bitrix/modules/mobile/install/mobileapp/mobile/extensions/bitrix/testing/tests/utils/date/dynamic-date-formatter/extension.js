(() => {
	const require = (ext) => jn.require(ext);

	const { describe, test, expect } = require('testing');
	const { DynamicDateFormatter } = require('utils/date/dynamic-date-formatter');
	const { Moment } = require('utils/date');
	const { datetime, shortTime, longTime } = require('utils/date/formats');

	const now = new Moment('June 16 2025 12:00:00');

	const setNow = (moment) => {
		moment.setNow(now.clone());

		return moment;
	};

	describe('DynamicDateFormatter: calculateBreakpoints', () => {
		test('numeric string keys are used as breakpoint seconds', () => {
			const moment = setNow(now.addSeconds(-20));

			const formatter = new DynamicDateFormatter({
				defaultFormat: datetime(),
				config: {
					30: () => 'within-30',
				},
			});

			expect(formatter.format(moment)).toBe('within-30');
		});

		test('numeric breakpoint "0" is treated as falsy and skipped', () => {
			const moment = setNow(now.addSeconds(-5));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					0: () => 'zero-breakpoint',
					60: () => 'within-minute',
				},
			});

			expect(formatter.format(moment)).toBe('within-minute');
		});

		test('unknown breakpoint key is ignored', () => {
			const moment = setNow(now.addSeconds(-10));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					UNKNOWN_KEY: () => 'unknown',
					60: () => 'within-minute',
				},
			});

			expect(formatter.format(moment)).toBe('within-minute');
		});

		test('unknown delta key returns null and breakpoint is skipped', () => {
			const moment = setNow(now.addSeconds(-10));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					DELTA_UNKNOWN: () => 'unknown-delta',
				},
			});

			expect(formatter.format(moment)).toBe('default');
		});

		test('unknown period key returns null and breakpoint is skipped', () => {
			const moment = setNow(now.addSeconds(-10));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					PERIOD_UNKNOWN: () => 'unknown-period',
				},
			});

			expect(formatter.format(moment)).toBe('default');
		});

		test('specific past config overrides general config', () => {
			const moment = setNow(now.addSeconds(-20));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					30: () => 'general',
					[DynamicDateFormatter.scope.PAST]: {
						30: () => 'past-specific',
					},
				},
			});

			expect(formatter.format(moment)).toBe('past-specific');
		});

		test('specific future config overrides general config', () => {
			const moment = setNow(now.addSeconds(20));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					30: () => 'general',
					[DynamicDateFormatter.scope.FUTURE]: {
						30: () => 'future-specific',
					},
				},
			});

			expect(formatter.format(moment)).toBe('future-specific');
		});

		test('past-specific config is not applied to future moments', () => {
			const moment = setNow(now.addSeconds(20));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					[DynamicDateFormatter.scope.PAST]: {
						30: () => 'past-only',
					},
				},
			});

			expect(formatter.format(moment)).toBe('default');
		});

		test('future-specific config is not applied to past moments', () => {
			const moment = setNow(now.addSeconds(-20));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					[DynamicDateFormatter.scope.FUTURE]: {
						30: () => 'future-only',
					},
				},
			});

			expect(formatter.format(moment)).toBe('default');
		});

		test('empty config returns default format', () => {
			const moment = setNow(now.addSeconds(-20));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {},
			});

			expect(formatter.format(moment)).toBe('default');
		});

		test('delta breakpoints are resolved and applied', () => {
			const moment = setNow(now.addSeconds(-30));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					[DynamicDateFormatter.deltas.MINUTE]: () => 'within-delta-minute',
				},
			});

			expect(formatter.format(moment)).toBe('within-delta-minute');
		});

		test('period breakpoints are resolved and applied', () => {
			const midHourNow = new Moment('June 16 2025 12:30:00');
			const moment = midHourNow.addMinutes(-10);
			moment.setNow(midHourNow.clone());

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					[DynamicDateFormatter.periods.HOUR]: () => 'within-period-hour',
				},
			});

			expect(formatter.format(moment)).toBe('within-period-hour');
		});

		test('larger breakpoint takes priority when moment is within both', () => {
			const moment = setNow(now.addSeconds(-20));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					30: () => 'narrow',
					[DynamicDateFormatter.deltas.MINUTE]: () => 'wide',
				},
			});

			expect(formatter.format(moment)).toBe('narrow');
		});

		test('moment outside all breakpoints uses default format', () => {
			const moment = setNow(now.addDays(-10));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					[DynamicDateFormatter.deltas.MINUTE]: () => 'within-minute',
					[DynamicDateFormatter.deltas.HOUR]: () => 'within-hour',
				},
			});

			expect(formatter.format(moment)).toBe('default');
		});

		test('mixed numeric, delta and period breakpoints work together', () => {
			const momentNear = setNow(now.addSeconds(-10));
			const momentMid = setNow(now.addMinutes(-5));
			const momentFar = setNow(now.addHours(-2));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					15: () => 'just-now',
					[DynamicDateFormatter.deltas.HOUR]: () => 'within-hour',
					[DynamicDateFormatter.periods.DAY]: () => 'today',
				},
			});

			expect(formatter.format(momentNear)).toBe('just-now');
			expect(formatter.format(momentMid)).toBe('within-hour');
			expect(formatter.format(momentFar)).toBe('today');
		});
	});

	describe('DynamicDateFormatter: getFormattedDatetime', () => {
		test('function format receives moment and returns string', () => {
			const moment = setNow(now.addSeconds(-10));

			const formatter = new DynamicDateFormatter({
				defaultFormat: (m) => `ts:${m.timestamp}`,
				config: {},
			});

			expect(formatter.format(moment)).toBe(`ts:${moment.timestamp}`);
		});

		test('string format is passed to moment.format()', () => {
			const moment = setNow(now.addSeconds(-10));

			const formatter = new DynamicDateFormatter({
				defaultFormat: 'HH:mm',
				config: {
					60: 'HH:mm:ss',
				},
			});

			expect(formatter.format(moment)).toBe(moment.format('HH:mm:ss'));
		});

		test('non-string non-function format returns null', () => {
			const moment = setNow(now.addSeconds(-10));

			const formatter = new DynamicDateFormatter({
				defaultFormat: 12345,
				config: {},
			});

			expect(formatter.format(moment)).toBeNull();
		});
	});

	describe('DynamicDateFormatter: resolveDelta', () => {
		test('DELTA_MINUTE resolves to 60 seconds', () => {
			const moment = setNow(now.addSeconds(-50));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					[DynamicDateFormatter.deltas.MINUTE]: () => 'matched',
				},
			});

			expect(formatter.format(moment)).toBe('matched');
		});

		test('DELTA_MINUTE does not match moment beyond 60 seconds', () => {
			const moment = setNow(now.addSeconds(-61));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					[DynamicDateFormatter.deltas.MINUTE]: () => 'matched',
				},
			});

			expect(formatter.format(moment)).toBe('default');
		});

		test('DELTA_HOUR resolves to 3600 seconds', () => {
			const moment = setNow(now.addMinutes(-30));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					[DynamicDateFormatter.deltas.HOUR]: () => 'matched',
				},
			});

			expect(formatter.format(moment)).toBe('matched');
		});

		test('DELTA_DAY resolves to 86400 seconds', () => {
			const moment = setNow(now.addHours(-12));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					[DynamicDateFormatter.deltas.DAY]: () => 'matched',
				},
			});

			expect(formatter.format(moment)).toBe('matched');
		});

		test('DELTA_YESTERDAY resolves to 2 days', () => {
			const moment = setNow(now.addDays(-1).addHours(-12));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					[DynamicDateFormatter.deltas.YESTERDAY]: () => 'matched',
				},
			});

			expect(formatter.format(moment)).toBe('matched');
		});

		test('DELTA_TOMORROW resolves to 2 days', () => {
			const moment = setNow(now.addDays(1).addHours(12));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					[DynamicDateFormatter.deltas.TOMORROW]: () => 'matched',
				},
			});

			expect(formatter.format(moment)).toBe('matched');
		});

		test('DELTA_WEEK resolves to 7 days', () => {
			const moment = setNow(now.addDays(-3));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					[DynamicDateFormatter.deltas.WEEK]: () => 'matched',
				},
			});

			expect(formatter.format(moment)).toBe('matched');
		});
	});

	describe('DynamicDateFormatter: format method ordering', () => {
		test('breakpoints are applied from largest to smallest', () => {
			const moment = setNow(now.addSeconds(-10));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					60: () => 'wide',
					30: () => 'narrow',
				},
			});

			expect(formatter.format(moment)).toBe('narrow');
		});

		test('stops at first non-matching breakpoint', () => {
			const moment = setNow(now.addSeconds(-45));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'default',
				config: {
					60: () => 'within-60',
					30: () => 'within-30',
				},
			});

			expect(formatter.format(moment)).toBe('within-60');
		});

		test('uses default format when no breakpoints match', () => {
			const moment = setNow(now.addMinutes(-10));

			const formatter = new DynamicDateFormatter({
				defaultFormat: () => 'fallback',
				config: {
					60: () => 'within-60',
				},
			});

			expect(formatter.format(moment)).toBe('fallback');
		});
	});

	describe('DynamicDateFormatter: constructor defaults', () => {
		test('uses datetime() as default format when not specified', () => {
			const moment = setNow(now.addDays(-30));

			const formatter = new DynamicDateFormatter({
				config: {},
			});

			const result = formatter.format(moment);
			const expected = moment.format(datetime());

			expect(result).toBe(expected);
		});
	});
})();
