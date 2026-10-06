/**
 * @module im/messenger/const/permission
 */
jn.define('im/messenger/const/permission', (require, exports, module) => {
	const ActionByUserType = Object.freeze({
		beChatManager: 'beChatManager',
		createChannel: 'createChannel',
		createChat: 'createChat',
		createCollab: 'createCollab',
		createConference: 'createConference',
		createAnyTask: 'createAnyTask',
		createCalendarEvent: 'createCalendarEvent',
		createCopilot: 'createCopilot',
		getChannels: 'getChannels',
		getMarket: 'getMarket',
		getOpenlines: 'getOpenlines',
		joinChat: 'joinChat',
		leaveCollab: 'leaveCollab',
		changeMessagesAutoDeleteDelay: 'changeMessagesAutoDeleteDelay',
		createStickerPack: 'createStickerPack',
		changeStickerPack: 'changeStickerPack',
		editChat: 'editChat',
		openCalendar: 'openCalendar',
		openProfile: 'openProfile',
		saveFileToDisk: 'saveFileToDisk',
	});

	const DialogPermissions = Object.freeze({
		manageUsersAdd: 'manageUsersAdd',
		manageUsersDelete: 'manageUsersDelete',
		manageUi: 'manageUi',
		manageSettings: 'manageSettings',
		manageMessages: 'manageMessages',
		manageGuestInvites: 'manageGuestInvites',
	});

	const RightsLevel = Object.freeze({
		all: 'all',
		owner: 'owner',
		manager: 'manager',
	});

	module.exports = {
		ActionByUserType,
		DialogPermissions,
		RightsLevel,
	};
});
