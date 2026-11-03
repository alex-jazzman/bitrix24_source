import { Type } from 'main.core';

import { VALUE_RULE_KEYS } from '../../../constants';
import { type ConstantSettings } from '../../../types';

/**
 * Value the field of a bound shows. Zero is a bound of its own, so only a missing bound leaves the
 * field empty.
 */
export function readBound(settings: ConstantSettings, name: string): string
{
	const bound = settings?.[VALUE_RULE_KEYS.ROOT]?.[name];

	return Type.isNil(bound) ? '' : String(bound);
}

/**
 * Settings carrying the entered bound. An emptied field drops the bound, an empty rule is no rule at
 * all, and the settings given are left untouched - they are the model of the form.
 */
export function writeBound(settings: ConstantSettings, name: string, value: string): ConstantSettings
{
	const rule = { ...settings?.[VALUE_RULE_KEYS.ROOT] };
	const bound = Number.parseInt(value, 10);

	if (Number.isNaN(bound))
	{
		delete rule[name];
	}
	else
	{
		rule[name] = bound;
	}

	const updatedSettings = { ...settings };
	if (Object.keys(rule).length > 0)
	{
		updatedSettings[VALUE_RULE_KEYS.ROOT] = rule;
	}
	else
	{
		delete updatedSettings[VALUE_RULE_KEYS.ROOT];
	}

	return updatedSettings;
}
