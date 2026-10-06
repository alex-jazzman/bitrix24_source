/**
 * @module im/messenger/provider/services/chat/create
 */
jn.define('im/messenger/provider/services/chat/create', (require, exports, module) => {
	const { Type } = require('type');
	const { RestMethod } = require('im/messenger/const');
	const { runAction } = require('im/messenger/lib/rest');
	const { Feature } = require('im/messenger/lib/feature');
	const { ChatDataExtractor } = require('im/messenger/provider/services/lib/chat-data-extractor');

	/**
	 * @class CreateService
	 */
	class CreateService
	{
		/**
		 * @param {CreateChatParams} params
		 * @returns {Promise<{chatId: number}>}
		 */
		async createChat(params)
		{
			const config = {
				type: params.type,
				ownerId: params.ownerId,
				searchable: params.searchable,
				memberEntities: params.memberEntities,
			};

			if (Type.isNumber(params.messagesAutoDeleteDelay))
			{
				config.messagesAutoDeleteDelay = params.messagesAutoDeleteDelay;
			}

			if (Type.isStringFilled(params.title))
			{
				config.title = params.title;
			}

			if (Type.isStringFilled(params.description))
			{
				config.description = params.description;
			}

			if (Type.isStringFilled(params.avatar))
			{
				config.avatar = params.avatar;
			}

			if (Type.isNumber(params.parentChatId))
			{
				config.parentChatId = params.parentChatId;
			}

			return runAction(RestMethod.imV2ChatAdd, {
				data: {
					fields: config,
				},
			});
		}

		/**
		 * @param {CreateCopilotParams} params
		 * @returns {Promise<{chatId: number}>}
		 */
		async createCopilot(params)
		{
			if (Type.isNumber(params.parentChatId))
			{
				const config = {
					type: params.type,
					copilotMainRole: params.copilotMainRole,
					parentChatId: params.parentChatId,
				};

				return runAction(RestMethod.imV2ChatAdd, {
					data: {
						fields: config,
					},
				});
			}

			if (Feature.isCopilotDraftChatAvailable)
			{
				return this.getOrCreateCopilotDraft();
			}

			const config = {
				type: params.type,
				copilotMainRole: params.copilotMainRole,
			};

			return runAction(RestMethod.imV2ChatAdd, {
				data: {
					fields: config,
				},
			});
		}

		/**
		 * @desc Gets or creates a hidden draft copilot chat (always universal role).
		 * The response comes in the chat-load format, so chatId is extracted from it.
		 * @returns {Promise<{chatId: number}>}
		 */
		async getOrCreateCopilotDraft()
		{
			const response = await runAction(RestMethod.imV2CopilotDraftChatGet);

			return { chatId: new ChatDataExtractor(response).getChatId() };
		}
	}

	module.exports = { CreateService };
});
