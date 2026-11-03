/**
 * @module mail/simple-list/items/conversation/src/conversation-interaction
 */
jn.define('mail/simple-list/items/conversation/src/conversation-interaction', (require, exports, module) => {
	const createConversationToggleHandlers = (toggle) => ({
		contentOnClick: toggle,
		expandOnClick: undefined,
	});
	const refreshConversationRow = ({ conversationId, revision = 0, getSummary, updateItems } = {}) => {
		const summary = getSummary?.(String(conversationId));
		if (!summary)
		{
			return null;
		}

		return updateItems?.([{
			...summary,
			conversationUiRevision: revision,
		}]) ?? null;
	};

	module.exports = { createConversationToggleHandlers, refreshConversationRow };
});
