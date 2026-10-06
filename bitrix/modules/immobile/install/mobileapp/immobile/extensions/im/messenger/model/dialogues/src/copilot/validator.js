/**
 * @module im/messenger/model/dialogues/copilot/validator
 */

jn.define('im/messenger/model/dialogues/copilot/validator', (require, exports, module) => {
	const { Type } = require('type');
	const { withCurrentDomain } = require('utils/url');

	/**
	 * @param {CopilotModelState} fields
	 */
	function validate(fields)
	{
		const result = {};

		if (!Type.isNil(fields.chats))
		{
			result.chats = fields.chats;
		}

		if (Type.isObjectLike(fields.engine))
		{
			result.engine = fields.engine;
		}

		if (Type.isArrayFilled(fields.engines))
		{
			result.engine = fields.engines[0];
		}

		if (Type.isBoolean(fields.changeEngine))
		{
			result.changeEngine = fields.changeEngine;
		}
		else
		{
			result.changeEngine = false;
		}

		if (!Type.isUndefined(fields.roles) && !Type.isNull(fields.roles))
		{
			Object.entries(fields.roles).forEach(([roleId, roleData]) => {
				if (!Type.isObject(roleData) || !Type.isObject(roleData.avatar))
				{
					return;
				}

				Object.entries(roleData.avatar).forEach(([avatarSize, avatarUrl]) => {
					if (!Type.isStringFilled(avatarUrl))
					{
						return;
					}

					// eslint-disable-next-line no-param-reassign
					fields.roles[roleId].avatar[avatarSize] = withCurrentDomain(avatarUrl);
				});
			});

			result.roles = fields.roles;
		}

		if (!Type.isUndefined(fields.messages) && !Type.isNull(fields.messages) && fields.messages.length > 0)
		{
			result.messages = fields.messages;
		}

		result.dialogId = fields.dialogId || '';
		result.aiProvider = fields.aiProvider || '';

		return result;
	}

	/**
	 * @param {CopilotModelState} newElem
	 * @param {CopilotModelState} existingElem
	 */
	function prepareMergeProperty(newElem, existingElem)
	{
		const result = {
			dialogId: newElem.dialogId || existingElem.dialogId,
			aiProvider: newElem.aiProvider || existingElem.aiProvider,
		};

		if (!Type.isUndefined(newElem.chats) && !Type.isNull(newElem.chats))
		{
			result.chats = mergeChats(existingElem.chats, newElem.chats);
		}
		else
		{
			result.chats = existingElem.chats;
		}

		if (Type.isNil(newElem.engine))
		{
			result.engine = existingElem.engine;
		}
		else
		{
			result.engine = { ...existingElem.engine, ...newElem.engine };
		}

		if (Type.isBoolean(newElem.changeEngine))
		{
			result.changeEngine = newElem.changeEngine;
		}
		else
		{
			result.changeEngine = existingElem.changeEngine ?? false;
		}

		if (!Type.isUndefined(newElem.roles) && !Type.isNull(newElem.roles))
		{
			result.roles = { ...existingElem.roles, ...newElem.roles };
		}

		if (!Type.isUndefined(newElem.messages) && !Type.isNull(newElem.messages) && newElem.messages.length > 0)
		{
			result.messages = [...new Set([...existingElem.messages, ...newElem.messages])];
		}

		return result;
	}

	/**
	 * @desc Partial payloads (e.g. search) carry chats without titleIsCustom/engine,
	 * so existing chat fields must survive the update instead of being replaced.
	 * Chats missing from the payload are preserved, same as in the updateRole action.
	 * @param {Array<ChatsCopilotDataItem>} existingChats
	 * @param {Array<ChatsCopilotDataItem>} newChats
	 * @return {Array<ChatsCopilotDataItem>}
	 */
	function mergeChats(existingChats, newChats)
	{
		if (!Type.isArrayFilled(existingChats))
		{
			return newChats;
		}

		const chatsByDialogId = new Map(existingChats.map((chat) => [chat.dialogId, chat]));

		newChats.forEach((chat) => {
			const existingChat = chatsByDialogId.get(chat.dialogId);
			chatsByDialogId.set(chat.dialogId, existingChat ? { ...existingChat, ...chat } : chat);
		});

		return [...chatsByDialogId.values()];
	}

	module.exports = {
		validate,
		prepareMergeProperty,
	};
});
