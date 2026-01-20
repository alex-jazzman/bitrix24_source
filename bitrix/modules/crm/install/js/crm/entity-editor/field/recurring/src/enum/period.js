import { Loc } from 'main.core';

export type Period = {
	value: number;
	title: string;
	titleGenitive?: string;
	extended: boolean;
}

type Periods = Object<string, Period>;

export const periods: Periods = Object.freeze({
	day: {
		value: 1,
		title: Loc.getMessage('CRM_EE_RECURRING_PERIOD_ITEM_DAY'),
		titleGenitive: Loc.getMessage('CRM_EE_RECURRING_MODE_SINGLE_FIELDS_PERIOD_DAY'),
		extended: false,
	},
	week: {
		value: 2,
		title: Loc.getMessage('CRM_EE_RECURRING_PERIOD_ITEM_WEEK'),
		titleGenitive: Loc.getMessage('CRM_EE_RECURRING_MODE_SINGLE_FIELDS_PERIOD_WEEK'),
		extended: false,
	},
	month: {
		value: 3,
		title: Loc.getMessage('CRM_EE_RECURRING_PERIOD_ITEM_MONTH'),
		titleGenitive: Loc.getMessage('CRM_EE_RECURRING_MODE_SINGLE_FIELDS_PERIOD_MONTH'),
		extended: false,
	},
	year: {
		value: 4,
		title: Loc.getMessage('CRM_EE_RECURRING_PERIOD_ITEM_YEAR'),
		extended: true,
	},
});

export function getPeriods(withExtended: boolean = false): Periods
{
	if (withExtended)
	{
		return periods;
	}

	const result = {};

	Object.keys(periods).forEach((periodName) => {
		if (periods[periodName].extended === false)
		{
			result[periodName] = periods[periodName];
		}
	});

	return Object.freeze(result);
}

export function getPeriodByValue(value: number): Period | null
{
	return Object.values(periods).find((item) => item.value === value) ?? null;
}