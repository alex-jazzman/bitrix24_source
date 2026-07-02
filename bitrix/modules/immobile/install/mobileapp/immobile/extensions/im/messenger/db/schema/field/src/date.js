/**
 * @module im/messenger/db/schema/field/src/date
 */
jn.define('im/messenger/db/schema/field/src/date', (require, exports, module) => {
	const { FieldType } = require('im/messenger/db/const');
	const { DateHelper } = require('im/messenger/lib/helper');
	const { getLogger } = require('im/messenger/lib/logger');

	const { OrderedField } = require('im/messenger/db/schema/field/src/ordered');

	const logger = getLogger('schema/date-field');

	/**
	 * @class DateField
	 */
	class DateField extends OrderedField
	{
		get fieldType()
		{
			return FieldType.date;
		}

		serializeDefault(value)
		{
			try
			{
				return DateHelper.cast(value).toISOString();
			}
			catch (error)
			{
				logger.error(`DateField.serialize error in ${this.name}:`, value, error);

				return null;
			}
		}

		restoreDefault(raw)
		{
			try
			{
				return DateHelper.cast(raw, null);
			}
			catch (error)
			{
				logger.error(`DateField.restore error in ${this.name}:`, raw, error);

				return null;
			}
		}

		/**
		 * @param {Date|string|number} value
		 * @return {LessThanCondition}
		 */
		before(value)
		{
			return this.lessThan(value);
		}

		/**
		 * @param {Date|string|number} value
		 * @return {GreaterThanCondition}
		 */
		after(value)
		{
			return this.greaterThan(value);
		}
	}

	module.exports = { DateField };
});
