/**
 * @module mail/const/src/ajax
 */
jn.define('mail/const/src/ajax', (require, exports, module) => {
	const AjaxMethod = Object.freeze({
		mailDelete: 'mail.message.delete',
		mailMarkAsSpam: 'mail.message.markAsSpam',
		mailMoveToFolder: 'mail.message.moveToFolder',
		mailCreateCrm: 'mail.message.createCrmActivities',
		mailChangeReadStatus: 'mail.message.changeReadStatus',

		addToEvent: 'mail.secretary.onCalendarSave',
		mailCreateChat: 'mail.secretary.createChatFromMessage',
		mailDiscussInChat: 'mail.secretary.discussMessageInChat',

		saveContactInAddressBook: 'mail.addressbook.saveContact',

		syncMailbox: 'mail.mailboxconnecting.syncMailbox',
		syncAllUserMailboxes: 'mail.mailboxconnecting.syncAllUserMailboxes',
		deleteMailbox: 'mail.mailboxconnecting.deleteMailbox',
		mailGetAvailableMailboxes: 'mail.mailboxconnecting.getAvailableMailboxes',
		isMailboxConnectingAvailable: 'mail.mailboxconnecting.isMailboxConnectingAvailable',
		getMailboxConnectionUrl: 'mail.mailboxconnecting.getConnectionUrl',
		connectMailbox: 'mail.mailboxconnecting.connectMailbox',
		getMailboxServices: 'mail.mailboxconnecting.getServices',
		getMailboxSettingsConfig: 'mail.mailboxconnecting.getSettingsConfig',
		getMailbox: 'mail.mailboxconnecting.getMailbox',
		updateMailbox: 'mail.mailboxconnecting.updateMailbox',
		getDefaultSettings: 'mail.mailboxconnecting.getDefaultSettings',
		checkConnectMailbox: 'mail.mailboxconnecting.checkConnectMailbox',
		createConnectionRequest: 'mail.mailboxconnectionrequest.createRequest',
		getOwnConnectionRequestStatus: 'mail.mailboxconnectionrequest.getOwnRequestStatus',
		getMailboxFoldersSettings: 'mail.mailboxsettings.getDirectoriesSettings',
		loadMailboxFolderChildren: 'mail.mailboxsettings.loadDirectoryChildren',
		saveMailboxFoldersSettings: 'mail.mailboxsettings.saveDirectoriesSettings',
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
