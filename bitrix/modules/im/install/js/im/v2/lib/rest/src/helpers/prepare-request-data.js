import { Type, type JsonObject, type JsonValue } from 'main.core';

export const prepareRequestData = (data: JsonObject): JsonObject => {
	if (data instanceof FormData)
	{
		return data;
	}

	if (!Type.isObjectLike(data))
	{
		return {};
	}

	return prepareValue(data);
};

const prepareValue = (value: JsonValue): JsonValue => {
	if (Type.isBoolean(value))
	{
		return value === true ? 'Y' : 'N';
	}

	if (Type.isArray(value))
	{
		return value.map((item) => prepareValue(item));
	}

	if (Type.isObject(value))
	{
		const prepared = {};
		for (const [key, nestedValue] of Object.entries(value))
		{
			prepared[key] = prepareValue(nestedValue);
		}

		return prepared;
	}

	return value;
};
