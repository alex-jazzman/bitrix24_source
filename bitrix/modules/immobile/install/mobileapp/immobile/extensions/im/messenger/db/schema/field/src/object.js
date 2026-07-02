/**
 * @module im/messenger/db/schema/field/src/object
 */
jn.define('im/messenger/db/schema/field/src/object', (require, exports, module) => {
	const { FieldType, FieldDefaultValue } = require('im/messenger/db/const');
	const { getLogger } = require('im/messenger/lib/logger');
	const { StructuredField } = require('im/messenger/db/schema/field/src/structured');

	const logger = getLogger('schema/object-field');

	/**
	 * @class ObjectField
	 */
	class ObjectField extends StructuredField
	{
		get fieldType()
		{
			return FieldType.object;
		}

		serializeDefault(value)
		{
			try
			{
				return JSON.stringify(value);
			}
			catch (error)
			{
				logger.error(`ObjectField.serialize error in ${this.name}:`, value, error);

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
				logger.error(`ObjectField.restore error in ${this.name}:`, raw, error);

				return FieldDefaultValue.emptyObject;
			}
		}
	}

	module.exports = { ObjectField };
});
