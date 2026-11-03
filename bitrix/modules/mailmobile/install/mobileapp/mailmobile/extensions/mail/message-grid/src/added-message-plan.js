/**
 * @module mail/message-grid/src/added-message-plan
 */
jn.define('mail/message-grid/src/added-message-plan', (require, exports, module) => {
	const planAddedMessages = ({ added = [], grouped = false, filterTopLevel = (items) => items } = {}) => {
		if (added.length === 0)
		{
			return { synchronizeGrouped: false, itemsToAdd: [] };
		}

		const topLevelAdded = filterTopLevel(added);
		if (grouped)
		{
			return { synchronizeGrouped: topLevelAdded.length > 0, itemsToAdd: [] };
		}

		return { synchronizeGrouped: false, itemsToAdd: topLevelAdded };
	};
	const promoteConversationRowReplacements = (operations = {}) => {
		const updates = operations.toUpdateItems ?? [];
		const conversationRows = updates.filter(({ conversationUiRevision }) => Number(conversationUiRevision) > 0);

		if (conversationRows.length === 0)
		{
			return operations;
		}

		return {
			...operations,
			toUpdateItems: updates.filter(({ conversationUiRevision }) => !(Number(conversationUiRevision) > 0)),
			toReplaceItems: [
				...(operations.toReplaceItems ?? []),
				...conversationRows.map((item) => ({ ...item, idToReplace: item.id })),
			],
		};
	};

	module.exports = { planAddedMessages, promoteConversationRowReplacements };
});
