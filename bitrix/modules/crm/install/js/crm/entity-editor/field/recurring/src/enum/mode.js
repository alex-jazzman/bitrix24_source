import { Loc } from 'main.core';

export type Mode = {
	value: string;
	title: string;
}

type ModeItems = Object<string, Mode>;

export const modeItems: ModeItems = Object.freeze({
	none: {
		value: 'N',
		title: Loc.getMessage('CRM_EE_RECURRING_MODE_ITEM_NONE'),
	},
	multiple: {
		value: '2',
		title: Loc.getMessage('CRM_EE_RECURRING_MODE_ITEM_MULTIPLE'),
	},
	single: {
		value: '1',
		title: Loc.getMessage('CRM_EE_RECURRING_MODE_ITEM_SINGLE'),
	},
});

export function getModeByValue(value: string): Mode | null
{
	return Object.values(modeItems).find((item) => item.value === value) ?? null;
}
