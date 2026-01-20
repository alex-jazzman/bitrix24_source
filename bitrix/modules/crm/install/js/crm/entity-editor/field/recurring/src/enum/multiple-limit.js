import { Loc } from 'main.core';

export type MultipleLimit = {
	value: string;
	title: string;
}

type MultipleLimits = Object<string, MultipleLimit>;

export const multipleLimits: MultipleLimits = Object.freeze({
	no: {
		value: 'N',
		title: Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_LIMIT_ITEM_NO'),
	},
	date: {
		value: 'D',
		title: Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_LIMIT_ITEM_DATE'),
	},
	times: {
		value: 'T',
		title: Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_LIMIT_ITEM_TIMES'),
	},
});

export function getMultipleLimitByValue(value: string): MultipleLimit | null
{
	return Object.values(multipleLimits).find((item) => item.value === value) ?? null;
}
