(() => {
	const require = (ext) => jn.require(ext);

	const { describe, test, expect } = require('testing');
	const { Duration } = require('utils/date');

	describe('Duration: constructor and factory methods', () => {
		test('creates from milliseconds', () => {
			const duration = new Duration(5000);
			expect(duration.milliseconds).toBe(5000);
		});

		test('uses absolute value for negative milliseconds', () => {
			const duration = new Duration(-5000);
			expect(duration.milliseconds).toBe(5000);
		});

		test('zero milliseconds', () => {
			const duration = new Duration(0);
			expect(duration.milliseconds).toBe(0);
		});

		test('createFromSeconds', () => {
			const duration = Duration.createFromSeconds(90);
			expect(duration.milliseconds).toBe(90000);
			expect(duration.seconds).toBe(90);
		});

		test('createFromMinutes', () => {
			const duration = Duration.createFromMinutes(5);
			expect(duration.milliseconds).toBe(300_000);
			expect(duration.minutes).toBe(5);
		});
	});

	describe('Duration: unit getters', () => {
		test('seconds floors down', () => {
			expect(new Duration(5999).seconds).toBe(5);
			expect(new Duration(5000).seconds).toBe(5);
			expect(new Duration(999).seconds).toBe(0);
		});

		test('minutes floors down', () => {
			expect(new Duration(90000).minutes).toBe(1);
			expect(new Duration(119_999).minutes).toBe(1);
			expect(new Duration(120_000).minutes).toBe(2);
		});

		test('hours', () => {
			expect(new Duration(3_600_000).hours).toBe(1);
			expect(new Duration(7_199_999).hours).toBe(1);
			expect(new Duration(7_200_000).hours).toBe(2);
		});

		test('days', () => {
			expect(new Duration(86_400_000).days).toBe(1);
			expect(new Duration(86_400_000 * 3).days).toBe(3);
		});

		test('months (31 days each)', () => {
			expect(new Duration(2_678_400_000).months).toBe(1);
			expect(new Duration(2_678_400_000 * 2).months).toBe(2);
		});

		test('years (365 days each)', () => {
			expect(new Duration(31_536_000_000).years).toBe(1);
			expect(new Duration(31_536_000_000 * 2).years).toBe(2);
		});

		test('zero duration returns zeros for all units', () => {
			const duration = new Duration(0);
			expect(duration.seconds).toBe(0);
			expect(duration.minutes).toBe(0);
			expect(duration.hours).toBe(0);
			expect(duration.days).toBe(0);
			expect(duration.months).toBe(0);
			expect(duration.years).toBe(0);
		});
	});

	describe('Duration: getLengthFormat', () => {
		test('returns correct constants', () => {
			const lengths = Duration.getLengthFormat();
			expect(lengths.SECOND).toBe(1000);
			expect(lengths.MINUTE).toBe(60000);
			expect(lengths.HOUR).toBe(3_600_000);
			expect(lengths.DAY).toBe(86_400_000);
			expect(lengths.MONTH).toBe(2_678_400_000);
			expect(lengths.YEAR).toBe(31_536_000_000);
		});
	});

	describe('Duration: format', () => {
		test('auto format with single unit', () => {
			const result = Duration.createFromSeconds(30).format();
			expect(result).toContain('30');
		});

		test('auto format skips zero units', () => {
			const result = Duration.createFromMinutes(90).format();
			expect(result).toContain('1');
			expect(result).toContain('30');
		});

		test('auto format uses mod values', () => {
			const result = Duration.createFromMinutes(90).format();
			expect(result).not.toContain('90');
		});

		test('format with explicit format string does not use mod', () => {
			const result = Duration.createFromMinutes(90).format('i');
			expect(result).toContain('90');
		});

		test('format with explicit format string for hours', () => {
			const result = Duration.createFromSeconds(7200).format('H');
			expect(result).toContain('2');
		});

		test('format zero duration is empty string', () => {
			const result = new Duration(0).format();
			expect(result).toBe('');
		});
	});

	describe('Duration: formatShort', () => {
		test('formatShort returns abbreviated string', () => {
			const full = Duration.createFromMinutes(90).format();
			const short = Duration.createFromMinutes(90).formatShort();

			expect(short.length).toBeLessThan(full.length);
		});

		test('formatShort uses Loc.getMessage, not getMessagePlural', () => {
			const one = Duration.createFromMinutes(1).formatShort();
			const five = Duration.createFromMinutes(5).formatShort();

			const oneSuffix = one.replace(/\d+/, '').trim();
			const fiveSuffix = five.replace(/\d+/, '').trim();

			expect(oneSuffix).toBe(fiveSuffix);
		});

		test('formatShort auto format skips zero units', () => {
			const result = Duration.createFromMinutes(5).formatShort();
			expect(result).toContain('5');
		});

		test('formatShort with explicit format string', () => {
			const result = Duration.createFromMinutes(90).formatShort('i');
			expect(result).toContain('90');
		});

		test('formatShort zero duration is empty string', () => {
			const result = new Duration(0).formatShort();
			expect(result).toBe('');
		});
	});
})();
