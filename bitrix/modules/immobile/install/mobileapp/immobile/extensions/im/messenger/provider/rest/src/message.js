/**
 * @module im/messenger/provider/rest/message
 */
jn.define('im/messenger/provider/rest/message', (require, exports, module) => {
	const { Type } = require('type');
	const { RestMethod } = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');

	/**
	 * @class MessageRest
	 */
	class MessageRest
	{
		send(options = {})
		{
			const messageAddParams = {
				dialogId: options.dialogId,
				fields: {},
			};

			if (Type.isStringFilled(options.text))
			{
				messageAddParams.fields.message = options.text;
			}

			if (options.replyId && Type.isNumber(options.replyId))
			{
				messageAddParams.fields.replyId = options.replyId;
			}

			if (Type.isString(options.templateId))
			{
				messageAddParams.fields.templateId = options.templateId;
			}

			if (Type.isObject(options.copilot))
			{
				messageAddParams.fields.copilot = options.copilot;
			}

			if (Type.isBoolean(options.copilot?.reasoning))
			{
				messageAddParams.fields.copilot.reasoning = options.copilot.reasoning ? 'Y' : 'N';
			}

			if (Type.isObject(options.forwardIds))
			{
				messageAddParams.fields.forwardIds = options.forwardIds;
			}

			if (Type.isPlainObject(options.stickerParams))
			{
				messageAddParams.fields.stickerParams = {
					id: options.stickerParams.id ?? options.stickerParams.stickerId,
					packId: options.stickerParams.packId,
					packType: options.stickerParams.packType,
				};
			}

			if (Type.isInteger(options.aiAssistant?.mcpAuthId))
			{
				messageAddParams.fields.aiAssistant = options.aiAssistant;
			}

			return runAction(RestMethod.imV2ChatMessageSend, {
				data: messageAddParams,
			});
		}

		like(options = {})
		{
			if (!options.messageId)
			{
				throw new Error('DialogRest: options.messageId is required.');
			}

			if (!Type.isNumber(options.messageId))
			{
				throw new TypeError('DialogRest: options.messageId is invalid.');
			}

			const messageLikeParams = {
				MESSAGE_ID: options.messageId,
				ACTION: ['auto', 'plus', 'minus'].includes(options.action) ? options.action : 'auto',
			};

			return BX.rest.callMethod(RestMethod.imMessageLike, messageLikeParams);
		}
	}

	module.exports = {
		MessageRest,
	};
});
