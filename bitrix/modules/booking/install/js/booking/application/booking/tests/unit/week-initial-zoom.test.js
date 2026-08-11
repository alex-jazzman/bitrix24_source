import { describe, it } from 'mocha';
import { assert } from 'chai';

import { WeekInitialZoom } from '../../src/lib/initial-zoom/week-initial-zoom';

const weekCellWidth = 145;
const daysInWeek = 7;
const weekDaysWidth = weekCellWidth * daysInWeek;
const leftPanelWidth = 193;
const sidebarZoneWidth = 260;
const containerWidthForZoom2 = leftPanelWidth + sidebarZoneWidth + weekDaysWidth * 2;
const baseMeasurements = {
	containerWidth: containerWidthForZoom2,
	leftPanelWidth,
	sidebarZoneWidth,
	weekCellWidth,
};

describe('WeekInitialZoom.calculate', () => {
	const weekInitialZoom = new WeekInitialZoom();

	const createMeasurements = (overrides = {}) => ({
		...baseMeasurements,
		...overrides,
	});

	it('returns 1 when available width is smaller than seven day columns', () => {
		const measurements = createMeasurements({
			containerWidth: 1200,
		});

		const result = weekInitialZoom.calculate(measurements);

		assert.equal(result, 1);
	});

	it('returns the exact coefficient when available width fits two week grids', () => {
		const measurements = createMeasurements();

		const result = weekInitialZoom.calculate(measurements);

		assert.equal(result, 2);
	});

	it('returns a fractional coefficient without rounding', () => {
		const expectedAvailableWidth = 2417;
		const measurements = createMeasurements({
			containerWidth: leftPanelWidth + sidebarZoneWidth + expectedAvailableWidth,
		});

		const result = weekInitialZoom.calculate(measurements);

		assert.equal(result, expectedAvailableWidth / weekDaysWidth);
	});

	it('returns 1 for invalid container width', () => {
		const measurements = createMeasurements({
			containerWidth: 0,
		});

		const result = weekInitialZoom.calculate(measurements);

		assert.equal(result, 1);
	});
});
