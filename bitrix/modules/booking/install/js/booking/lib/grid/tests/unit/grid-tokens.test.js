import { describe, it } from 'mocha';
import { assert } from 'chai';

import { GridTokenCssVar, GridTokenKey, gridTokens } from 'booking.lib.grid';

const tokenValues = {
	[GridTokenKey.DayCellWidth]: 301.5,
	[GridTokenKey.DayCellHeight]: 55.5,
	[GridTokenKey.DayHourHeight]: 50.5,
	[GridTokenKey.DayDaysPanelHeight]: 40.5,
	[GridTokenKey.WeekCellWidth]: 168,
	[GridTokenKey.WeekCellHeight]: 80.5,
	[GridTokenKey.WeekCellPadding]: 9.5,
	[GridTokenKey.WeekDaysPanelHeight]: 41.5,
	[GridTokenKey.LeftPanelWidthDay]: 50.5,
	[GridTokenKey.LeftPanelWidthAmPm]: 65.5,
	[GridTokenKey.LeftPanelWidthWeek]: 193.5,
	[GridTokenKey.SidebarZoneWidth]: 260.5,
};

function getExpectedTokenValues(values: Object): Object
{
	return {
		...values,
		[GridTokenKey.WeekHourWidth]: values[GridTokenKey.WeekCellWidth] / 24,
	};
}

function createBaseElement(values: Object = tokenValues): HTMLElement
{
	const element = document.createElement('div');

	for (const [tokenKey, cssVar] of Object.entries(GridTokenCssVar))
	{
		element.style.setProperty(cssVar, `${values[tokenKey]}px`);
	}

	document.body.append(element);

	return element;
}

function assertTokenValues(expectedTokenValues: Object): void
{
	for (const tokenKey of Object.values(GridTokenKey))
	{
		assert.property(expectedTokenValues, tokenKey);
		assert.equal(gridTokens.get(tokenKey), expectedTokenValues[tokenKey]);
	}
}

async function catchInitError(element: HTMLElement): Promise<Error | null>
{
	try
	{
		await gridTokens.init(element);

		return null;
	}
	catch (error)
	{
		return error;
	}
}

describe('gridTokens', () => {
	it('parses all available token values from CSS custom properties', async () => {
		const element = createBaseElement();
		const expectedTokenValues = getExpectedTokenValues(tokenValues);

		const initPromise = gridTokens.init(element);

		assert.instanceOf(initPromise, Promise);
		await initPromise;

		assertTokenValues(expectedTokenValues);

		element.remove();
	});

	it('recalculates all available token values from current CSS custom properties', async () => {
		const values = {
			...tokenValues,
			[GridTokenKey.WeekCellWidth]: 240,
		};
		const element = createBaseElement(values);
		const expectedTokenValues = getExpectedTokenValues(values);

		await gridTokens.init(element);

		assertTokenValues(expectedTokenValues);

		element.remove();
	});

	for (const cssVar of Object.values(GridTokenCssVar))
	{
		it(`throws when ${cssVar} token value is not found`, async () => {
			const element = createBaseElement();
			element.style.removeProperty(cssVar);

			const initError = await catchInitError(element);

			try
			{
				assert.instanceOf(initError, Error);
				assert.equal(initError.message, `Booking.GridTokens: token ${cssVar} is not defined`);
			}
			finally
			{
				element.remove();
			}
		});
	}

	it('throws when token value can not be parsed', async () => {
		const element = createBaseElement();
		const cssVar = GridTokenCssVar[GridTokenKey.WeekCellWidth];
		element.style.setProperty(cssVar, 'incorrect');

		const initError = await catchInitError(element);

		try
		{
			assert.instanceOf(initError, Error);
			assert.equal(initError.message, `Booking.GridTokens: token ${cssVar} is incorrect`);
		}
		finally
		{
			element.remove();
		}
	});
});
