import {Type} from 'main.core';

export const DEFAULT_PRECISION = 2;

export function parseIntValue(value: number | string, defaultValue: number = 0): number
{
	let result;

	const isNumberValue = Type.isNumber(value);
	const isStringValue = Type.isStringFilled(value);

	if (!isNumberValue && !isStringValue)
	{
		return defaultValue;
	}

	if (isStringValue)
	{
		let v = (value as string).replace(/^\s+|\s+$/g, '');
		const isNegative = v.indexOf('-') === 0;
		result = parseInt(v.replace(/[^\d]/g, ''), 10);
		if (isNaN(result))
		{
			result = defaultValue;
		}
		else if (isNegative)
		{
			result = -result;
		}
	}
	else
	{
		result = parseInt(value as any, 10);
		if (isNaN(result))
		{
			result = defaultValue;
		}
	}

	return result;
}

export function parseFloatValue(value: number | string, precision: number = DEFAULT_PRECISION, defaultValue: number = 0.0): number
{
	let result: number;

	const isNumberValue = Type.isNumber(value);
	const isStringValue = Type.isStringFilled(value);

	if (!isNumberValue && !isStringValue)
	{
		return defaultValue;
	}

	if (isStringValue)
	{
		let v = (value as string).replace(/^\s+|\s+$/g, '');

		const dot = v.indexOf('.');
		const comma = v.indexOf(',');
		const isNegative = v.indexOf('-') === 0;

		if (dot < 0 && comma >= 0)
		{
			let s1 = v.substr(0, comma);
			const decimalLength = v.length - comma - 1;

			if (decimalLength > 0)
			{
				s1 += '.' + v.substr(comma + 1, decimalLength);
			}

			v = s1;
		}

		v = v.replace(/[^\d.]+/g, '');
		result = parseFloat(v);

		if (isNaN(result))
		{
			result = defaultValue;
		}
		if (isNegative)
		{
			result = -result;
		}
	}
	else
	{
		result = parseFloat(value as any);
	}

	if (precision >= 0)
	{
		result = round(result, precision);
	}

	return result;
}

export function round(value: number, precision: number = DEFAULT_PRECISION): number
{
	const factor = Math.pow(10, precision);

	return Math.round(value * factor) / factor;
}
