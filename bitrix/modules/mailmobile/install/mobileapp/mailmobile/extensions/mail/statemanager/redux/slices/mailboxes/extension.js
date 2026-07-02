/**
 * @module mail/statemanager/redux/slices/mailboxes
 */
jn.define('mail/statemanager/redux/slices/mailboxes', (require, exports, module) => {
	const { createSlice } = require('statemanager/redux/toolkit');
	const { StateCache } = require('statemanager/redux/state-cache');
	const { sliceName, mailboxesListAdapter } = require('mail/statemanager/redux/slices/mailboxes/meta');
	const { MailboxModel } = require('mail/statemanager/redux/slices/mailboxes/model/mailbox');
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { deleteMailbox, syncMailbox, syncAllUserMailboxes } = require('mail/statemanager/redux/slices/mailboxes/thunk');
	const { removePending, removeFulfilled, syncMailboxFulfilled } = require('mail/statemanager/redux/slices/mailboxes/extra-reducer');
	const { adjustUnreadCounters } = require('mail/statemanager/redux/slices/messages/thunk');

	const preparePayload = (mailboxes) => {
		return mailboxes.map((mailbox) => MailboxModel.prepareReduxMailboxFromServer(mailbox));
	};

	const defaultState = {
		...mailboxesListAdapter.getInitialState(),
		currentMailboxId: null,
		startEmailSender: null,
		messageCounterInAllMailboxes: 0,
	};
	const initialState = StateCache.getReducerState(sliceName, defaultState);

	const mailboxesSlice = createSlice({
		name: sliceName,
		initialState,
		reducers: {
			mailboxesAdded: {
				reducer: mailboxesListAdapter.upsertMany,
				prepare: (mailboxes) => ({
					payload: preparePayload(mailboxes),
				}),
			},
			setCurrentMailbox: (state, { payload }) => {
				const {
					mailboxId,
					startEmailSender = null,
				} = payload;

				state.currentMailboxId = mailboxId;
				state.startEmailSender = startEmailSender;
			},
			setMessageCounterInAllMailboxes: (state, { payload }) => {
				const {
					messageCounterInAllMailboxes = 0,
				} = payload;

				state.messageCounterInAllMailboxes = messageCounterInAllMailboxes;
			},
		},
		extraReducers: (builder) => {
			builder
				.addCase(deleteMailbox.pending, removePending)
				.addCase(deleteMailbox.fulfilled, removeFulfilled)
				.addCase(syncMailbox.fulfilled, syncMailboxFulfilled)
				.addCase(syncAllUserMailboxes.fulfilled, syncMailboxFulfilled)
				.addCase(adjustUnreadCounters, (state, action) => {
					const { globalCounterDelta } = action.payload;
					if (globalCounterDelta)
					{
						state.messageCounterInAllMailboxes = Math.max(0, state.messageCounterInAllMailboxes + globalCounterDelta);
					}
				})
			;
		},
	});

	const {
		mailboxesAdded,
		setCurrentMailbox,
		setMessageCounterInAllMailboxes,
	} = mailboxesSlice.actions;

	ReducerRegistry.register(sliceName, mailboxesSlice.reducer);

	module.exports = {
		setMessageCounterInAllMailboxes,
		setCurrentMailbox,
		mailboxesSlice,
		mailboxesAdded,
	};
});
