/**
 * @module mail/statemanager/redux/slices/mailboxes
 */
jn.define('mail/statemanager/redux/slices/mailboxes', (require, exports, module) => {

	const { createSlice } = require('statemanager/redux/toolkit');
	const { sliceName, mailboxesListAdapter } = require('mail/statemanager/redux/slices/mailboxes/meta');
	const { MailboxModel } = require('mail/statemanager/redux/slices/mailboxes/model/mailbox');
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { deleteMailbox, syncMailbox } = require('mail/statemanager/redux/slices/mailboxes/thunk');
	const { removePending, removeFulfilled, syncMailboxFulfilled } = require('mail/statemanager/redux/slices/mailboxes/extra-reducer');

	const preparePayload = (mailboxes) => {
		return mailboxes.map((mailbox) => MailboxModel.prepareReduxMailboxFromServer(mailbox));
	};

	const mailboxesSlice = createSlice({
		name: sliceName,
		initialState: {
			...mailboxesListAdapter.getInitialState(),
			currentMailboxId: null,
			startEmailSender: null,
		},
		reducers: {
			mailboxesAdded: {
				reducer: mailboxesListAdapter.addMany,
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
		},
		extraReducers: (builder) => {
			builder
				.addCase(deleteMailbox.pending, removePending)
				.addCase(deleteMailbox.fulfilled, removeFulfilled)
				.addCase(syncMailbox.fulfilled, syncMailboxFulfilled)
			;
		},
	});

	const {
		mailboxesAdded,
		setCurrentMailbox,
	} = mailboxesSlice.actions;

	ReducerRegistry.register(sliceName, mailboxesSlice.reducer);

	module.exports = {
		setCurrentMailbox,
		mailboxesSlice,
		mailboxesAdded,
	};
});
