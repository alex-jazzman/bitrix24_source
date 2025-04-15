/**
 * @module im/messenger/model/counter/validator
 */
jn.define('im/messenger/model/counter/validator', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * @param fields
	 */
	function validate(fields)
	{
		const result = {};

		if (Type.isNumber(fields.chatId))
		{
			result.chatId = fields.chatId;
		}

		if (Type.isNumber(fields.parentChatId))
		{
			result.parentChatId = fields.parentChatId;
		}

		if (Type.isStringFilled(fields.type))
		{
			result.type = fields.type;
		}

		if (Type.isNumber(fields.counter))
		{
			result.counter = fields.counter;
		}

		return result;
	}

	module.exports = { validate };
});
