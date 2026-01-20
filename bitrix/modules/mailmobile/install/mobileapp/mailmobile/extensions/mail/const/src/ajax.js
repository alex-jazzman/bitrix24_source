/**
 * @module mail/const/src/ajax
 */
jn.define('mail/const/src/ajax', (require, exports, module) => {
	const AjaxMethod = Object.freeze({
		mailChangeReadStatus: 'mail.message.changeReadStatus',
		mailCreateCrm: 'mail.message.createCrmActivities',
		mailCreateChat: 'mail.secretary.createChatFromMessage',
		mailMoveToFolder: 'mail.message.moveToFolder',
		mailDelete: 'mail.message.delete',
		mailGetList: 'mail.message.getMessageList',
		mailGetAvailableMailboxes: 'mail.mailboxconnecting.getAvailableMailboxes',
		crmFileUploader: 'crm.FileUploader.MailUploaderController',
		mailFileUploader: 'mailmobile.FileUploader.MailUploaderController',
		syncMailbox: 'mail.mailboxconnecting.syncMailbox',
		deleteMailbox: 'mail.mailboxconnecting.deleteMailbox',
		saveContactInAddressBook: 'mail.addressbook.saveContact',
		isMailboxConnectingAvailable: 'mail.mailboxconnecting.isMailboxConnectingAvailable',
	});

	module.exports = {
		AjaxMethod,
	};
});
