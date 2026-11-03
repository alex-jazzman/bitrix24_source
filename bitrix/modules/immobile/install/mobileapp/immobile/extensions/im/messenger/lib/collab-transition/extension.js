/**
 * @module im/messenger/lib/collab-transition
 */
jn.define('im/messenger/lib/collab-transition', (require, exports, module) => {
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * Collects the chats of the project tree that are worth opening on transition.
	 * @param {number} parentChatId
	 * @return {Array<CollabTransitionCandidate>}
	 */
	function collectCollabTransitionCandidates(parentChatId)
	{
		if (parentChatId <= 0)
		{
			return [];
		}

		const store = serviceLocator.get('core').getStore();
		const shownChatId = resolveShownChatId(store, parentChatId);
		const result = [];

		const parentItem = store.getters['counterModel/getByChatId'](parentChatId);
		if (parentItem && isCandidate(parentItem))
		{
			result.push(build(store, parentItem, true, shownChatId));
		}

		const descendants = store.getters['counterModel/getActiveDescendants'](parentChatId);
		for (const childItem of descendants)
		{
			if (isCandidate(childItem))
			{
				result.push(build(store, childItem, false, shownChatId));
			}
		}

		return result;
	}

	/**
	 * @param {Array<CollabTransitionCandidate>} candidates
	 * @return {?CollabTransitionCandidate}
	 */
	function selectCollabTransitionTarget(candidates)
	{
		if (candidates.length === 0)
		{
			return null;
		}

		const shownInRecent = candidates.find((candidate) => candidate.isShownInRecent);
		if (shownInRecent)
		{
			return shownInRecent;
		}

		const isOrderKnown = candidates.every((candidate) => candidate.lastMessageId > 0);

		return candidates.reduce((best, candidate) => {
			return isNewer(candidate, best, isOrderKnown) ? candidate : best;
		});
	}

	/**
	 * The same predicate the aggregated badge is built on: muting outweighs the unread mark.
	 * @param {CounterModelState} item
	 * @return {boolean}
	 */
	function isCandidate(item)
	{
		const hasUnread = item.counter > 0 || item.isMarkedAsUnread;

		return hasUnread && !item.isMuted;
	}

	/**
	 * @param {MessengerCoreStore} store
	 * @param {CounterModelState} item
	 * @param {boolean} isParent
	 * @param {number} shownChatId
	 * @return {CollabTransitionCandidate}
	 */
	function build(store, item, isParent, shownChatId)
	{
		const dialogId = `chat${item.chatId}`;

		return {
			chatId: item.chatId,
			dialogId,
			lastMessageId: resolveLastMessageId(store, item.chatId, dialogId),
			isParent,
			isShownInRecent: item.chatId === shownChatId,
		};
	}

	/**
	 * The redirected `message.id` of the recent item is never used: for a project row it may point
	 * to a message of a child chat.
	 * @param {MessengerCoreStore} store
	 * @param {number} chatId
	 * @param {string} dialogId
	 * @return {number}
	 */
	function resolveLastMessageId(store, chatId, dialogId)
	{
		const dialog = store.getters['dialoguesModel/getByChatId'](chatId);
		if (dialog?.lastMessageId > 0)
		{
			return dialog.lastMessageId;
		}

		const recentItem = store.getters['recentModel/getById'](dialogId);
		const ownMessageId = Number(recentItem?.ownMessage?.id);

		return ownMessageId > 0 ? ownMessageId : 0;
	}

	/**
	 * The row of the project shows the newest message of its tree. A message redirected from a
	 * nested chat carries the id of that chat; a row showing its own message has no own message
	 * sent alongside and is the project chat itself.
	 * @param {MessengerCoreStore} store
	 * @param {number} parentChatId
	 * @return {number}
	 */
	function resolveShownChatId(store, parentChatId)
	{
		const recentItem = store.getters['recentModel/getById'](`chat${parentChatId}`);
		if (!recentItem)
		{
			return 0;
		}

		const shownChatId = Number(recentItem.message?.chatId);
		if (shownChatId > 0)
		{
			return shownChatId;
		}

		return recentItem.ownMessage ? 0 : parentChatId;
	}

	/**
	 * Keys are taken into account only when they are known for every candidate; on a draw
	 * a child chat wins over the parent, and among children the newer chat (the larger chatId) wins.
	 * @param {CollabTransitionCandidate} candidate
	 * @param {CollabTransitionCandidate} best
	 * @param {boolean} isOrderKnown
	 * @return {boolean}
	 */
	function isNewer(candidate, best, isOrderKnown)
	{
		if (isOrderKnown && candidate.lastMessageId !== best.lastMessageId)
		{
			return candidate.lastMessageId > best.lastMessageId;
		}

		if (candidate.isParent !== best.isParent)
		{
			return best.isParent;
		}

		return candidate.chatId > best.chatId;
	}

	module.exports = {
		collectCollabTransitionCandidates,
		selectCollabTransitionTarget,
	};
});
