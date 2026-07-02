import { resolvePresetValue } from '../src/helpers/resolve-preset-value';
import { getPresetSubtitle } from '../src/helpers/get-preset-subtitle';

describe('Resolve preset value', () => {
	describe('single mode', () => {
		it('Should resolve a Date value', () => {
			const date = new Date(Date.UTC(2024, 4, 16));
			const result = resolvePresetValue({ label: 't', value: date }, 'single');

			assert.equal(result.length, 1);
			assert.equal(result[0].getUTCFullYear(), 2024);
			assert.equal(result[0].getUTCMonth(), 4);
			assert.equal(result[0].getUTCDate(), 16);
		});

		it('Should resolve a string value with a format', () => {
			const result = resolvePresetValue(
				{ label: 't', value: '16.05.2024' },
				'single',
				'DD.MM.YYYY',
			);

			assert.equal(result.length, 1);
			assert.equal(result[0].getUTCDate(), 16);
			assert.equal(result[0].getUTCMonth(), 4);
			assert.equal(result[0].getUTCFullYear(), 2024);
		});

		it('Should resolve a numeric (timestamp) value', () => {
			const ts = Date.UTC(2024, 4, 16, 10, 0, 0);
			const result = resolvePresetValue({ label: 't', value: ts }, 'single');

			assert.equal(result.length, 1);
			assert.equal(result[0].getTime(), ts);
		});

		it('Should call function and resolve its return value', () => {
			const result = resolvePresetValue(
				{ label: 't', value: () => new Date(Date.UTC(2024, 4, 16)) },
				'single',
			);

			assert.equal(result.length, 1);
			assert.equal(result[0].getUTCDate(), 16);
		});

		it('Should unwrap an array and take the first element', () => {
			const a = new Date(Date.UTC(2024, 4, 16));
			const b = new Date(Date.UTC(2024, 4, 17));
			const result = resolvePresetValue({ label: 't', value: [a, b] }, 'single');

			assert.equal(result.length, 1);
			assert.equal(result[0].getUTCDate(), 16);
		});

		it('Should return null for an invalid value', () => {
			const result = resolvePresetValue({ label: 't', value: { not: 'a date' } }, 'single');

			assert.equal(result, null);
		});

		it('Should return null when the function throws', () => {
			const result = resolvePresetValue(
				{ label: 't', value: () => { throw new Error('boom'); } },
				'single',
			);

			assert.equal(result, null);
		});
	});

	describe('multiple mode', () => {
		it('Should wrap a single value into an array', () => {
			const result = resolvePresetValue(
				{ label: 't', value: new Date(Date.UTC(2024, 4, 16)) },
				'multiple',
			);

			assert.equal(result.length, 1);
			assert.equal(result[0].getUTCDate(), 16);
		});

		it('Should accept an array of dates', () => {
			const dates = [
				new Date(Date.UTC(2024, 4, 16)),
				new Date(Date.UTC(2024, 4, 17)),
				new Date(Date.UTC(2024, 4, 18)),
			];
			const result = resolvePresetValue({ label: 't', value: dates }, 'multiple');

			assert.equal(result.length, 3);
		});

		it('Should drop invalid items from the array', () => {
			const result = resolvePresetValue(
				{
					label: 't',
					value: [
						new Date(Date.UTC(2024, 4, 16)),
						{ not: 'a date' },
						new Date(Date.UTC(2024, 4, 18)),
					],
				},
				'multiple',
			);

			assert.equal(result.length, 2);
			assert.equal(result[0].getUTCDate(), 16);
			assert.equal(result[1].getUTCDate(), 18);
		});

		it('Should return null when all items are invalid', () => {
			const result = resolvePresetValue(
				{ label: 't', value: [{ a: 1 }, { b: 2 }] },
				'multiple',
			);

			assert.equal(result, null);
		});
	});

	describe('range mode', () => {
		it('Should wrap a single value to [a, a]', () => {
			const date = new Date(Date.UTC(2024, 4, 16));
			const result = resolvePresetValue({ label: 't', value: date }, 'range');

			assert.equal(result.length, 2);
			assert.equal(result[0].getUTCDate(), 16);
			assert.equal(result[1].getUTCDate(), 16);
		});

		it('Should swap when start > end', () => {
			const start = new Date(Date.UTC(2024, 4, 20));
			const end = new Date(Date.UTC(2024, 4, 16));
			const result = resolvePresetValue({ label: 't', value: [start, end] }, 'range');

			assert.equal(result[0].getUTCDate(), 16);
			assert.equal(result[1].getUTCDate(), 20);
		});

		it('Should return null when array has only one element', () => {
			const result = resolvePresetValue(
				{ label: 't', value: [new Date(Date.UTC(2024, 4, 16))] },
				'range',
			);

			assert.equal(result, null);
		});

		it('Should return null when start or end is invalid', () => {
			const result = resolvePresetValue(
				{ label: 't', value: [new Date(Date.UTC(2024, 4, 16)), { invalid: true }] },
				'range',
			);

			assert.equal(result, null);
		});

		it('Should resolve via function returning a range', () => {
			const result = resolvePresetValue(
				{
					label: 't',
					value: () => [
						new Date(Date.UTC(2024, 4, 16)),
						new Date(Date.UTC(2024, 4, 20)),
					],
				},
				'range',
			);

			assert.equal(result.length, 2);
			assert.equal(result[0].getUTCDate(), 16);
			assert.equal(result[1].getUTCDate(), 20);
		});
	});
});

describe('Preset subtitle resolver', () => {
	const dates = [new Date(Date.UTC(2024, 4, 16))];
	const autoFn = () => 'AUTO';

	it('Should return auto subtitle when subtitle is undefined', () => {
		const result = getPresetSubtitle({ label: 't', value: dates[0] }, dates, autoFn);

		assert.equal(result, 'AUTO');
	});

	it('Should return null when subtitle is an empty string', () => {
		const result = getPresetSubtitle({ label: 't', value: dates[0], subtitle: '' }, dates, autoFn);

		assert.equal(result, null);
	});

	it('Should return the literal string subtitle', () => {
		const result = getPresetSubtitle(
			{ label: 't', value: dates[0], subtitle: 'custom' },
			dates,
			autoFn,
		);

		assert.equal(result, 'custom');
	});

	it('Should call the function subtitle with resolved dates', () => {
		let received = null;
		const result = getPresetSubtitle(
			{
				label: 't',
				value: dates[0],
				subtitle: (input) => {
					received = input;

					return 'fn-result';
				},
			},
			dates,
			autoFn,
		);

		assert.equal(result, 'fn-result');
		assert.equal(received, dates);
	});

	it('Should return null when function subtitle returns empty/null/undefined', () => {
		assert.equal(
			getPresetSubtitle({ label: 't', value: dates[0], subtitle: () => '' }, dates, autoFn),
			null,
		);
		assert.equal(
			getPresetSubtitle({ label: 't', value: dates[0], subtitle: () => null }, dates, autoFn),
			null,
		);
		assert.equal(
			getPresetSubtitle({ label: 't', value: dates[0], subtitle: () => undefined }, dates, autoFn),
			null,
		);
	});

	it('Should return null when function subtitle throws', () => {
		const result = getPresetSubtitle(
			{ label: 't', value: dates[0], subtitle: () => { throw new Error('boom'); } },
			dates,
			autoFn,
		);

		assert.equal(result, null);
	});

	it('Should return null when resolved dates are null', () => {
		const result = getPresetSubtitle({ label: 't', value: dates[0] }, null, autoFn);

		assert.equal(result, null);
	});
});
