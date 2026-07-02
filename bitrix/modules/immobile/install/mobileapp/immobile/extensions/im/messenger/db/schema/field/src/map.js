/**
 * @module im/messenger/db/schema/field/src/map
 */
jn.define('im/messenger/db/schema/field/src/map', (require, exports, module) => {
	const { Type } = require('type');
	const { FieldType } = require('im/messenger/db/const');
	const { getLogger } = require('im/messenger/lib/logger');

	const { StructuredField } = require('im/messenger/db/schema/field/src/structured');

	const logger = getLogger('schema/map-field');

	/**
	 * @class MapField
	 */
	class MapField extends StructuredField
	{
		get fieldType()
		{
			return FieldType.map;
		}

		serializeDefault(value)
		{
			try
			{
				if (value instanceof Map)
				{
					return JSON.stringify(Object.fromEntries(value));
				}

				return JSON.stringify(value);
			}
			catch (error)
			{
				logger.error(`MapField.serialize error in ${this.name}:`, value, error);

				return null;
			}
		}

		restoreDefault(raw)
		{
			try
			{
				const parsed = JSON.parse(raw);

				return new Map(Object.entries(parsed));
			}
			catch (error)
			{
				logger.error(`MapField.restore error in ${this.name}:`, raw, error);

				return new Map();
			}
		}
	}

	module.exports = { MapField };
});
