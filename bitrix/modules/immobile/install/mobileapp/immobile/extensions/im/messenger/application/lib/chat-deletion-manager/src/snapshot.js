/**
 * @module im/messenger/application/lib/chat-deletion-manager/src/snapshot
 */
jn.define('im/messenger/application/lib/chat-deletion-manager/src/snapshot', (require, exports, module) => {
	const { Type } = require('type');
	const { DialogHelper } = require('im/messenger/lib/helper');

	/**
	 * Resolves the chatId from a {dialogId|chatId} pair. Standalone so both the manager
	 * (dedupe key) and the announcer can resolve it without instantiating the snapshot.
	 *
	 * @param {{ dialogId?: DialogId, chatId?: number }} params
	 * @return {?number}
	 */
	function resolveChatId(params)
	{
		if (Type.isNumber(params.chatId))
		{
			return params.chatId;
		}

		const helper = DialogHelper.createByDialogId(params.dialogId);
		if (helper && Type.isNumber(helper.chatId))
		{
			return helper.chatId;
		}

		// Fallback for the `chatN` dialogId shape.
		const match = /^chat(\d+)$/.exec(String(params.dialogId));
		if (match)
		{
			return Number(match[1]);
		}

		return null;
	}

	/**
	 * @class ChatDeletionSnapshot
	 *
	 * Maps the pre-removal chat data into the announce fact.
	 */
	class ChatDeletionSnapshot
	{
		/**
		 * Called before data removal so the parent's coordinates (parentChatId, chatType)
		 * are still intact. Open children are resolved later by the announcer.
		 *
		 * @param {{ dialogId: DialogId, chatId: number, chatData: ?object, origin: string, reason: string }} params
		 * @return {ChatDeletedEvent}
		 */
		capture({ dialogId, chatId, chatData, origin, reason })
		{
			return {
				dialogId,
				chatId,
				parentChatId: chatData?.parentChatId ?? 0,
				chatType: chatData?.type ?? null,
				origin,
				reason,
			};
		}
	}

	module.exports = { ChatDeletionSnapshot, resolveChatId };
});
