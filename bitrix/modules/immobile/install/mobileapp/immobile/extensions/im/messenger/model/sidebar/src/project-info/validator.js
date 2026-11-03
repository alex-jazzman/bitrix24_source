/**
 * @module im/messenger/model/sidebar/src/project-info/validator
 */

jn.define('im/messenger/model/sidebar/src/project-info/validator', (require, exports, module) => {
	const { Type } = require('type');

	const { projectInfoDefaultElement } = require('im/messenger/model/sidebar/src/project-info/default-element');

	/**
	 * Normalizes the whole element: an absent or broken field falls back to its empty value,
	 * so a partial payload can never leave values from the previous panel opening.
	 *
	 * @param {SidebarProjectInfoPayload} [fields]
	 * @return {SidebarProjectInfoItem}
	 */
	function validate(fields)
	{
		const result = projectInfoDefaultElement();

		if (!Type.isPlainObject(fields))
		{
			return result;
		}

		if (Type.isString(fields.description))
		{
			result.description = fields.description;
		}

		if (Type.isString(fields.goal))
		{
			result.goal = fields.goal;
		}

		result.dateStart = validateCalendarDate(fields.dateStart);
		result.dateFinish = validateCalendarDate(fields.dateFinish);

		if (Type.isArray(fields.tags))
		{
			result.tags = fields.tags.filter((tag) => Type.isString(tag));
		}

		return result;
	}

	/**
	 * @param {string|null} value
	 * @return {string|null} null means the date is not set
	 */
	function validateCalendarDate(value)
	{
		if (!Type.isString(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value))
		{
			return null;
		}

		return value;
	}

	module.exports = { validate };
});
