/**
 * @module mail/statemanager/redux/slices/mailboxes/model/mailbox
 */
jn.define('mail/statemanager/redux/slices/mailboxes/model/mailbox', (require, exports, module) => {
	class MailboxModel
	{
		/**
		 * @public
		 * @param {object} sourceMailboxData
		 * @returns {MailboxReduxModel}
		 */
		static prepareReduxMailboxFromServer(sourceMailboxData)
		{
			return {
				userName: sourceMailboxData.USERNAME,
				id: Number(sourceMailboxData.ID),
				name: sourceMailboxData.NAME,
				email: sourceMailboxData.EMAIL,
				counter: sourceMailboxData.COUNTER,
			};
		}
	}

	module.exports = { MailboxModel };
});
