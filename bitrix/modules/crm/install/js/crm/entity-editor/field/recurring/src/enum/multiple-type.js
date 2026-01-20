import { Loc } from 'main.core';

export type MultipleType = {
	value: number;
	title: string;
}

type MultipleTypes = Object<string, MultipleType>;

export const multipleTypes: MultipleTypes = Object.freeze({
	day: {
		value: 1,
		title: Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_TYPE_ITEM_DAY'),
	},
	week: {
		value: 2,
		title: Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_TYPE_ITEM_WEEK'),
	},
	month: {
		value: 3,
		title: Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_TYPE_ITEM_MONTH'),
	},
	year: {
		value: 4,
		title: Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_TYPE_ITEM_YEAR'),
	},
	custom: {
		value: 5,
		title: Loc.getMessage('CRM_EE_RECURRING_MULTIPLE_TYPE_ITEM_CUSTOM'),
	},
});

export function getMultipleTypeByValue(value: number): Period | null
{
	return Object.values(multipleTypes).find((item) => item.value === value) ?? null;
}
