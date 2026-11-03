/* eslint-disable flowtype/require-return-type */

/**
 * @module im/messenger/provider/rest/src/ai-task
 */
jn.define('im/messenger/provider/rest/src/ai-task', (require, exports, module) => {
	const { Type } = require('type');
	const { runAction } = require('im/messenger/lib/rest');
	const { RestMethod } = require('im/messenger/const');

	/**
	 * @class AiTaskRest
	 */
	class AiTaskRest
	{
		/**
		 * @desc Creates an AI task from a single message.
		 * @param {object} options
		 * @param {number} options.messageId
		 */
		createByMessage(options = {})
		{
			if (!Type.isNumber(options.messageId))
			{
				throw new TypeError('AiTaskRest: options.messageId must be a number.');
			}

			return this.#createByAi([options.messageId]);
		}

		/**
		 * @desc Creates an AI task from a list of messages.
		 * @param {object} options
		 * @param {number[]} options.messageIds
		 */
		createByMessageList(options = {})
		{
			if (!Type.isArrayFilled(options.messageIds))
			{
				throw new TypeError('AiTaskRest: options.messageIds must be a non-empty array.');
			}

			if (!options.messageIds.every((messageId) => Type.isNumber(messageId)))
			{
				throw new TypeError('AiTaskRest: options.messageIds must contain only numbers.');
			}

			return this.#createByAi(options.messageIds);
		}

		/**
		 * @param {number[]} ids
		 */
		#createByAi(ids)
		{
			return runAction(RestMethod.imV2ChatTaskCreateByAi, { data: { ids } });
		}
	}

	module.exports = {
		AiTaskRest,
	};
});
