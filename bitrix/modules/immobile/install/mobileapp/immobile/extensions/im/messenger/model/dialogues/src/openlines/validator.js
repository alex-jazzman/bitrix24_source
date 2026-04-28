/**
 * @module im/messenger/model/dialogues/openlines/validator
 */

jn.define('im/messenger/model/dialogues/openlines/validator', (require, exports, module) => {
	const { Type } = require('type');
	const { OpenlineStatus } = require('im/messenger/const');

	/**
	 * @param {OpenlinesSessionModelState} fields
	 */
	function validate(fields)
	{
		const result = {};

		if (Type.isNumber(fields.id))
		{
			result.id = fields.id;
		}

		if (Type.isNumber(fields.chatId))
		{
			result.chatId = fields.chatId;
		}

		if (Type.isNumber(fields.operatorId))
		{
			result.operatorId = fields.operatorId;
		}

		const status = fields.status.toLowerCase();
		if (Type.isStringFilled(OpenlineStatus[status]))
		{
			result.status = status;
		}

		if (Type.isNumber(fields.queueId))
		{
			result.queueId = fields.queueId;
		}

		if (Type.isBoolean(fields.pinned))
		{
			result.pinned = fields.pinned;
		}

		if (Type.isBoolean(fields.isClosed))
		{
			result.isClosed = fields.isClosed;
		}

		return result;
	}

	module.exports = {
		validate,
	};
});
