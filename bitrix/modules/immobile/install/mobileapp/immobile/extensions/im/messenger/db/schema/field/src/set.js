/**
 * @module im/messenger/db/schema/field/src/set
 */
jn.define('im/messenger/db/schema/field/src/set', (require, exports, module) => {
	const { Type } = require('type');
	const { FieldType } = require('im/messenger/db/const');
	const { getLogger } = require('im/messenger/lib/logger');

	const { StructuredField } = require('im/messenger/db/schema/field/src/structured');

	const logger = getLogger('schema/set-field');

	/**
	 * @class SetField
	 */
	class SetField extends StructuredField
	{
		get fieldType()
		{
			return FieldType.set;
		}

		serializeDefault(value)
		{
			try
			{
				if (value instanceof Set)
				{
					return JSON.stringify([...value]);
				}

				return JSON.stringify(value);
			}
			catch (error)
			{
				logger.error(`SetField.serialize error in ${this.name}:`, value, error);

				return null;
			}
		}

		restoreDefault(raw)
		{
			try
			{
				return new Set(JSON.parse(raw));
			}
			catch (error)
			{
				logger.error(`SetField.restore error in ${this.name}:`, raw, error);

				return new Set();
			}
		}
	}

	module.exports = { SetField };
});
