/**
 * @module mail/const/src/ajax
 */
jn.define('mail/const/src/ajax', (require, exports, module) => {
	const AjaxMethod = Object.freeze({
		mailDelete: 'mail.message.delete',
		mailMoveToFolder: 'mail.message.moveToFolder',
		mailCreateCrm: 'mail.message.createCrmActivities',
		mailChangeReadStatus: 'mail.message.changeReadStatus',

		addToEvent: 'mail.secretary.onCalendarSave',
		mailCreateChat: 'mail.secretary.createChatFromMessage',
		mailDiscussInChat: 'mail.secretary.discussMessageInChat',

		saveContactInAddressBook: 'mail.addressbook.saveContact',

		syncMailbox: 'mail.mailboxconnecting.syncMailbox',
		deleteMailbox: 'mail.mailboxconnecting.deleteMailbox',
		mailGetAvailableMailboxes: 'mail.mailboxconnecting.getAvailableMailboxes',
		isMailboxConnectingAvailable: 'mail.mailboxconnecting.isMailboxConnectingAvailable',

		getMessageChain: 'mailmobile.api.Message.getChain',
		mailGetList: 'mailmobile.api.Message.getMessageList',
		mailGetFilterPresets: 'mailmobile.api.Message.getFilterPresets',
		mailFileUploader: 'mailmobile.FileUploader.MailUploaderController',

		crmFileUploader: 'crm.FileUploader.MailUploaderController',
	});

	module.exports = {
		AjaxMethod,
	};
});
