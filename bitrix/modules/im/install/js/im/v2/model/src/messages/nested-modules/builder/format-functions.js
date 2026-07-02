import { Type, type JsonObject } from 'main.core';

import { type FieldsConfig, formatFieldsWithConfig } from 'im.v2.model';

export const prepareSources = (target: JsonObject, config: FieldsConfig): JsonObject => {
	const result = {};
	for (const [key, value] of Object.entries(target))
	{
		if (Type.isPlainObject(value))
		{
			result[key] = formatFieldsWithConfig(value, config);
		}
	}

	return result;
};
