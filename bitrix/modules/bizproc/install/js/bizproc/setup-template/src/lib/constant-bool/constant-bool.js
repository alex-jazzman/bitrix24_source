import { Type } from 'main.core';

export const BOOL_VALUES = Object.freeze({
	YES: 'Y',
	NO: 'N',
});

// Values a bool constant may already hold: the server normalizes these synonyms to Y/N, so every
// control that shows such a value has to recognize them. Kept in one place for the launch form and
// the setup wizard alike.
const TRUE_VALUES = new Set(['y', 'yes', 'true', '1']);

/**
 * A bool value in the wire format. An empty value belongs to a constant that was never filled in:
 * the controls have no third state, and both the form and the wizard show such a value as "no".
 */
export function normalizeBoolValue(value: mixed): string
{
	const normalized = Type.isString(value) ? value.trim().toLowerCase() : '';

	return TRUE_VALUES.has(normalized) ? BOOL_VALUES.YES : BOOL_VALUES.NO;
}

export function isBoolValueChecked(value: mixed): boolean
{
	return normalizeBoolValue(value) === BOOL_VALUES.YES;
}
