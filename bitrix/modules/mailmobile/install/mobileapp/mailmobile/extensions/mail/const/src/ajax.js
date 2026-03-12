/**
 * @module mail/const/src/ajax
 */
jn.define('mail/const/src/ajax', (require, exports, module) => {
	const AjaxMethod = Object.freeze({
		mailChangeReadStatus: 'mail.message.changeReadStatus',
		mailCreateCrm: 'mail.message.createCrmActivities',
		mailCreateChat: 'mail.secretary.createChatFromMessage',
		mailDiscussInChat: 'mail.secretary.discussMessageInChat',
		mailMoveToFolder: 'mail.message.moveToFolder',
		mailDelete: 'mail.message.delete',
		addToEvent: 'mail.secretary.onCalendarSave',
		mailGetList: 'mail.message.getMessageList',
		mailGetAvailableMailboxes: 'mail.mailboxconnecting.getAvailableMailboxes',
		crmFileUploader: 'crm.FileUploader.MailUploaderController',
		mailFileUploader: 'mailmobile.FileUploader.MailUploaderController',
		syncMailbox: 'mail.mailboxconnecting.syncMailbox',
		deleteMailbox: 'mail.mailboxconnecting.deleteMailbox',
		saveContactInAddressBook: 'mail.addressbook.saveContact',
		isMailboxConnectingAvailable: 'mail.mailboxconnecting.isMailboxConnectingAvailable',
		getMessageChain: 'mailmobile.api.Message.getChain',
	});

	module.exports = {
		AjaxMethod,
	};
});
