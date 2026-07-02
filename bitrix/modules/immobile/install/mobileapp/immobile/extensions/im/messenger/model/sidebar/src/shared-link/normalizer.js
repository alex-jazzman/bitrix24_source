/**
 * @module im/messenger/model/sidebar/src/shared-link/normalizer
 */

jn.define('im/messenger/model/sidebar/src/shared-link/normalizer', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * @param {Object} fields
	 * @return {Object}
	 */
	function normalize(fields)
	{
		const result = {};

		if (!Type.isPlainObject(fields))
		{
			return result;
		}

		if (Type.isNumber(fields.id))
		{
			result.id = fields.id;
		}

		if (Type.isStringFilled(fields.code))
		{
			result.code = fields.code;
		}

		if (Type.isDate(fields.dateCreate) || Type.isStringFilled(fields.dateCreate))
		{
			result.dateCreate = fields.dateCreate;
		}

		if (Type.isDate(fields.dateExpire) || Type.isString(fields.dateExpire) || Type.isNull(fields.dateExpire))
		{
			result.dateExpire = fields.dateExpire;
		}

		if (Type.isStringFilled(fields.entityId) || Type.isNumber(fields.entityId))
		{
			result.entityId = String(fields.entityId);
		}

		if (Type.isStringFilled(fields.entityType))
		{
			result.entityType = fields.entityType;
		}

		if (Type.isBoolean(fields.requireApproval))
		{
			result.requireApproval = fields.requireApproval;
		}

		if (Type.isStringFilled(fields.type))
		{
			result.type = fields.type;
		}

		if (Type.isStringFilled(fields.url))
		{
			result.url = fields.url;
		}

		return result;
	}

	module.exports = { normalize };
});
