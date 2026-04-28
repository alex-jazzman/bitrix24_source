/**
 * @module im/messenger/model/counter/src/normalizer
 */
jn.define('im/messenger/model/counter/src/normalizer', (require, exports, module) => {
	const { Type } = require('type');

	/**
	 * @param {Partial<CounterModelState>} fields
	 * @return {Partial<CounterModelState>}
	 */
	function normalize(fields)
	{
		/** @type {Partial<CounterModelState>} */
		const result = {};

		if (Type.isNumber(fields.chatId))
		{
			result.chatId = fields.chatId;
		}

		if (Type.isNumber(fields.parentChatId))
		{
			result.parentChatId = fields.parentChatId;
		}

		if (Type.isNumber(fields.counter))
		{
			result.counter = fields.counter;
		}

		if (Type.isArray(fields.recentSections))
		{
			result.recentSections = fields.recentSections;
		}

		if (Type.isBoolean(fields.isMuted))
		{
			result.isMuted = fields.isMuted;
		}

		if (Type.isBoolean(fields.isMarkedAsUnread))
		{
			result.isMarkedAsUnread = fields.isMarkedAsUnread;
		}

		return result;
	}

	module.exports = { normalize };
});
