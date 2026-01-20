/**
 * @module mail/statemanager/redux/slices/mailboxes/extra-reducer
 */
jn.define('mail/statemanager/redux/slices/mailboxes/extra-reducer', (require, exports, module) => {
	const { showErrorToast } = require('toast');
	const { NotifyManager } = require('notify-manager');
	const { mailboxesListAdapter } = require('mail/statemanager/redux/slices/mailboxes/meta');

	const removePending = () => {
		NotifyManager.showLoadingIndicator();
	};

	const removeFulfilled = (state, action) => {
		const mailboxId = action.meta.arg.mailboxId;

		const { errors } = action.payload;
		if (errors && errors.length > 0)
		{
			showErrorToast(errors[0]);
		}
		else
		{
			mailboxesListAdapter.removeOne(state, mailboxId);
			const newCurrentMailboxId = Math.min(...state.ids);
			const newCurrentMailbox = state.entities[newCurrentMailboxId];
			state.currentMailboxId = newCurrentMailboxId;
			state.startEmailSender = newCurrentMailbox.email;
		}
		NotifyManager.hideLoadingIndicatorWithoutFallback();
	};

	const syncMailboxFulfilled = (state, action) => {
		const { errors } = action.payload;
		if (errors && errors.length > 0)
		{
			showErrorToast(errors[0]);
		}
	};

	module.exports = {
		removePending,
		removeFulfilled,
		syncMailboxFulfilled,
	};
});
