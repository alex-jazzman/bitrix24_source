import { Text, Type } from 'main.core';

// BX.util.number_format defaults to two decimals and a dot as the thousands separator,
// so every argument has to be passed explicitly.
const DECIMALS = 0;
const DECIMAL_SEPARATOR = '.';

export function formatCounterValue(value: number, thousandsSeparator: string): string
{
	// An empty string is a legal separator of a culture, so the type is checked instead of truthiness.
	const separator = Type.isString(thousandsSeparator) ? thousandsSeparator : '';

	return BX.util.number_format(normalizeValue(value), DECIMALS, DECIMAL_SEPARATOR, separator);
}

function normalizeValue(value: number): number
{
	if (Type.isNumber(value) && Number.isFinite(value))
	{
		return value;
	}

	// "No data" must not silently turn into "zero signers"
	console.error('sign.v2.document-counter: counter value is not a finite number', value);

	const parsedValue = Text.toNumber(value);

	return Number.isFinite(parsedValue) ? parsedValue : 0;
}
