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
		mailSetFavoriteState: 'mail.api.message.setFavoriteState',

		addToEvent: 'mail.secretary.onCalendarSave',
		mailCreateChat: 'mail.secretary.createChatFromMessage',
		mailDiscussInChat: 'mail.secretary.discussMessageInChat',
		mailBindFeedPost: 'mail.secretary.bindFeedPost',

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
		// API-01: the decision for a message the list of letters carries none for - the announcement of
		// the portal and the offer beside the message about a mailbox that stopped synchronizing
		mailMigrationNoticeGet: 'mail.MigrationNotice.get',
		// API-02: the decision itself travels with the message list, only the reaction is a call
		mailMigrationNoticeReact: 'mail.MigrationNotice.react',
		getMessageChain: 'mailmobile.api.Message.getChain',
		mailLabelList: 'mail.api.label.list',
		mailLabelMessageLabels: 'mail.api.label.messageLabels',
		mailLabelAssign: 'mail.api.label.assign',
		mailLabelUnassign: 'mail.api.label.unassign',
		mailGetList: 'mailmobile.api.Message.getMessageList',
		getConversationItems: 'mail.api.messageconversation.items',
		executeConversationAction: 'mail.api.messageconversation.execute',
		getConversationSettings: 'mail.api.messageconversation.getSettings',
		setConversationSettings: 'mail.api.messageconversation.setSettings',
		captureConversationOnboardingEligibility:
			'mail.api.messageconversation.captureOnboardingEligibility',
		markConversationOnboarding: 'mail.api.messageconversation.markOnboarding',
		mailGetFilterPresets: 'mailmobile.api.Message.getFilterPresets',
		generateSubject: 'mailmobile.api.Message.generateSubject',
		getSubjectGenerationAvailable: 'mailmobile.api.Message.getSubjectGenerationAvailable',
		mailFileUploader: 'mailmobile.FileUploader.MailUploaderController',
		createBitrixMailbox: 'mailmobile.api.Mailbox.createBitrixMailbox',
		getCreateBitrixMailboxState: 'mailmobile.api.Mailbox.getFeatureState',
		mailDraftConfig: 'mail.api.draft.config',
		mailDraftSave: 'mail.api.draft.save',
		mailDraftGet: 'mail.api.draft.get',
		mailDraftList: 'mail.api.draft.list',
		mailDraftDelete: 'mail.api.draft.delete',
		mailDraftDeleteMany: 'mail.api.draft.deleteMany',
		mailLargeAttachmentConvert: 'mail.largeAttachment.convert',
		mailLargeAttachmentDeleteUploaded: 'mail.largeAttachment.deleteUploaded',
		mailLargeAttachmentFinalizeReplacement: 'mail.largeAttachment.finalizeReplacement',
		// the same user option the web writes its guide marks into: the name of the option comes from the server
		saveUserOption: 'main.userOption.saveOptions',

		crmDraftGetByContext: 'crm.api.mail.draft.getByContext',
		crmDraftSave: 'crm.api.mail.draft.save',
		crmDraftDeleteCurrent: 'crm.api.mail.draft.deleteCurrent',

		crmFileUploader: 'crm.FileUploader.MailUploaderController',
	});

	module.exports = {
		AjaxMethod,
	};
});
