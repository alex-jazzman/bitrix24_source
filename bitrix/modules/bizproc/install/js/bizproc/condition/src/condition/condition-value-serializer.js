import { Type } from 'main.core';
import { Operator } from '../operator/operator';

export const isMultiValueOperator = (operator: string): boolean => (
	operator === Operator.IN || operator === Operator.NOT_IN
);

export const isValuelessOperator = (operator: string): boolean => (
	operator === Operator.EMPTY || operator === Operator.NOT_EMPTY
);

// Bring a value entered under the previous operator into the shape the new one reads. An array is a
// value only for `in`/`!in` (transported as JSON) and for BETWEEN (transported as a pair of slots);
// anywhere else it is not a value but its first item, and an operator without a value carries none.
export function adaptValueToOperator(operator: string, value): mixed
{
	if (isValuelessOperator(operator))
	{
		return '';
	}

	if (isMultiValueOperator(operator) || operator === Operator.BETWEEN)
	{
		return value;
	}

	return Array.isArray(value) ? (value[0] ?? '') : value;
}

const isScalarValue = (value): boolean => (
	Type.isString(value) || Type.isNumber(value) || Type.isBoolean(value)
);

// array value of an `in`/`!in` condition is transported as a JSON string in a single value slot.
export function serializeConditionValue(operator: string, value): mixed
{
	if (isMultiValueOperator(operator) && Array.isArray(value))
	{
		return JSON.stringify(value);
	}

	return Array.isArray(value) ? (value[0] ?? '') : value;
}

// unserialize a single value slot back to an array only for `in`/`!in` with a valid JSON array of scalars.
export function unserializeConditionValue(operator: string, rawValue): mixed
{
	if (!isMultiValueOperator(operator) || !Type.isString(rawValue) || !(/^\s*\[/).test(rawValue))
	{
		return rawValue;
	}

	let parsed;
	try
	{
		parsed = JSON.parse(rawValue);
	}
	catch (error)
	{
		return rawValue;
	}

	if (!Array.isArray(parsed) || !parsed.every(isScalarValue))
	{
		return rawValue;
	}

	// Mirror PHP `(string)` scalar coercion of unserializeConditionValue: true → '1', false → ''.
	return parsed.map((item) => {
		if (Type.isBoolean(item))
		{
			return item ? '1' : '';
		}

		return String(item);
	});
}
