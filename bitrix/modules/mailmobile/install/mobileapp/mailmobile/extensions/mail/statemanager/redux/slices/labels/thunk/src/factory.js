/**
 * @module mail/statemanager/redux/slices/labels/thunk/src/factory
 */
jn.define('mail/statemanager/redux/slices/labels/thunk/src/factory', (require, exports, module) => {
	const { createAsyncThunk } = require('statemanager/redux/toolkit');
	const { AjaxMethod } = require('mail/const');
	const { sliceName } = require('mail/statemanager/redux/slices/labels/meta');

	/**
	 * Thunks of the labels domain over injected ports: the transport, the network check and the
	 * action of the slice come from outside, so the behaviour is driven without the global store.
	 *
	 * @param {{
	 *     runAction: function(string, object): Promise<object>,
	 *     isOnline: function(): boolean,
	 *     labelsReceived: function(object[]): object,
	 *     getCurrentMailboxId: function(): (number|null),
	 * }} ports
	 */
	/**
	 * An answer belongs to the current mailbox while the mailbox is not chosen yet: the first fetch
	 * runs before the store knows the mailbox, and dropping it would leave the dictionary empty.
	 */
	const isAnswerOfCurrentMailbox = (currentMailboxId, answerMailboxId) => {
		if (currentMailboxId === null || currentMailboxId === undefined || Number(currentMailboxId) === 0)
		{
			return true;
		}

		return Number(currentMailboxId) === Number(answerMailboxId);
	};

	const createLabelsThunks = ({ runAction, isOnline, labelsReceived, getCurrentMailboxId = () => null }) => {
		const condition = () => isOnline();

		// The web action mail.api.label.list returns { labels } and denies with an error when the
		// domain is off; the availability flag comes with the message list into the folders slice,
		// so it is not derived here. An off domain yields an error, hence an empty dictionary.
		const fetchLabels = createAsyncThunk(
			`${sliceName}/fetchLabels`,
			async ({ mailboxId }, { dispatch }) => {
				const response = await runAction(AjaxMethod.mailLabelList, { mailboxId });
				const labels = response?.labels ?? [];

				// The dictionary is one for the whole domain, so a late answer for a mailbox the user
				// has already left would replace the labels of the current one.
				if (isAnswerOfCurrentMailbox(getCurrentMailboxId(), mailboxId))
				{
					dispatch(labelsReceived(labels));
				}

				return { labels };
			},
			{ condition },
		);

		/**
		 * An id the server did not echo in processedIds was not written: the surface that asked
		 * rolls its optimistic state back by that list.
		 */
		const writeLabels = (name, action) => createAsyncThunk(
			`${sliceName}/${name}`,
			async ({ labelIds, ids }) => {
				const response = await runAction(action, { labelIds, ids });
				const processedIds = response?.processedIds ?? [];

				return {
					processedIds,
					notApplied: ids.filter((id) => !processedIds.includes(id)),
				};
			},
			{ condition },
		);

		return {
			fetchLabels,
			assignLabels: writeLabels('assignLabels', AjaxMethod.mailLabelAssign),
			unassignLabels: writeLabels('unassignLabels', AjaxMethod.mailLabelUnassign),
		};
	};

	module.exports = { createLabelsThunks, isAnswerOfCurrentMailbox };
});
