/**
 * @module mail/statemanager/redux/slices/mailboxes/selector
 */
jn.define('mail/statemanager/redux/slices/mailboxes/selector', (require, exports, module) => {
	const { sliceName, mailboxesListAdapter } = require('mail/statemanager/redux/slices/mailboxes/meta');
	const {
		selectAll,
		selectById,
		selectEntities,
	} = mailboxesListAdapter.getSelectors((state) => state[sliceName]);

	const selectCurrentMailboxId = (state) => state['mail:mailboxes'].currentMailboxId;
	const selectStartEmailSender = (state) => state['mail:mailboxes'].startEmailSender;

	const selectCurrentMailbox = (state) => {
		const currentMailboxId = selectCurrentMailboxId(state);

		return currentMailboxId ? selectById(state, currentMailboxId) : null;
	};

	const selectMailboxesSortedById = (state) => {
		const entities = selectEntities(state) || {};

		return Object.values(entities)
			.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
	};

	module.exports = {
		selectAll,
		selectById,
		selectEntities,
		selectCurrentMailbox,
		selectCurrentMailboxId,
		selectMailboxesSortedById,
		selectStartEmailSender,
	};
});
