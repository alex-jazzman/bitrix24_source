/**
 * @module im/messenger/db/schema/field/src/array
 */
jn.define('im/messenger/db/schema/field/src/array', (require, exports, module) => {
	const { FieldType, FieldDefaultValue } = require('im/messenger/db/const');
	const { getLogger } = require('im/messenger/lib/logger');
	const { StructuredField } = require('im/messenger/db/schema/field/src/structured');

	const logger = getLogger('schema/array-field');

	/**
	 * @class ArrayField
	 */
	class ArrayField extends StructuredField
	{
		get fieldType()
		{
			return FieldType.array;
		}

		serializeDefault(value)
		{
			try
			{
				return JSON.stringify(value);
			}
			catch (error)
			{
				logger.error(`ArrayField.serialize error in ${this.name}:`, value, error);

				return null;
			}
		}

		restoreDefault(raw)
		{
			try
			{
				return JSON.parse(raw);
			}
			catch (error)
			{
				logger.error(`ArrayField.restore error in ${this.name}:`, raw, error);

				return FieldDefaultValue.emptyArray;
			}
		}
	}

	module.exports = { ArrayField };
});
