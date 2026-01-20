export const EventType = {
	// internal
	dialog:
	{
		onDialogInited: 'IM:Dialog:onDialogInited',
		onMessageDeleted: 'IM:Dialog:onMessageDeleted',
		onMessageIsVisible: 'IM:Dialog:onMessageIsVisible',
		onMessageIsNotVisible: 'IM:Dialog:onMessageIsNotVisible',
		onClickMessageContextMenu: 'IM:Dialog:onClickMessageContextMenu',

		scrollToBottom: 'IM:Dialog:scrollToBottom',
		goToMessageContext: 'IM:Dialog:goToMessageContext',
		showForwardPopup: 'IM:Dialog:showForwardPopup',
		openComments: 'IM:Dialog:openComments',
		closeComments: 'IM:Dialog:closeComments',
		showLoadingBar: 'IM:Dialog:showLoadingBar',
		hideLoadingBar: 'IM:Dialog:hideLoadingBar',
		showQuoteButton: 'IM:Dialog:showQuoteButton',
		openBulkActionsMode: 'IM:Dialog:openBulkActionsMode',
		closeBulkActionsMode: 'IM:Dialog:closeBulkActionsMode',
	},
	textarea:
	{
		onAfterSendMessage: 'IM:Textarea:onAfterSendMessage',

		editMessage: 'IM:Textarea:editMessage',
		replyMessage: 'IM:Textarea:replyMessage',
		insertText: 'IM:Textarea:insertText',
		insertMention: 'IM:Textarea:insertMention',
		insertForward: 'IM:Textarea:insertForward',
		sendMessage: 'IM:Textarea:sendMessage',
		openUploadPreview: 'IM:Textarea:openUploadPreview',
	},
	sidebar:
	{
		open: 'IM:Sidebar:open',
		close: 'IM:Sidebar:close',
	},
	header:
	{
		openAddToChatPopup: 'IM:Header:openAddToChatPopup',
	},
	search:
	{
		keyPressed: 'IM:Search:keyPressed',
	},
	recent:
	{
		openSearch: 'IM.Recent:openSearch',
	},
	mention:
	{
		selectItem: 'IM:Mention:selectItem',
	},
	reaction:
	{
		onReactionSelected: 'IM:Reaction:onReactionSelected',
	},
	slider:
	{
		onClose: 'onChatSliderClose',
	},
	request:
	{
		onAuthError: 'IM:request:onAuthError',
	},
	audioPlayer:
	{
		play: 'IM:AudioPlayer:play',
		stop: 'IM:AudioPlayer:stop',
		pause: 'IM:AudioPlayer:pause',
		preload: 'IM:AudioPlayer:preload',
	},
	roundVideoPlayer:
	{
		playNext: 'IM:RoundVideoPlayer:playNext',
		onClickPlay: 'IM:RoundVideoPlayer:onClickPlay',
	},
	key:
	{
		onBeforeEscape: 'IM:Keys:onBeforeEscape',
	},
	notifier:
	{
		onBeforeShowMessage: 'IM:Notifier:onBeforeShowMessage',
	},

	// external
	layout:
	{
		onLayoutChange: 'IM.Layout:onLayoutChange',
		onOpenNotifications: 'IM.Layout:onOpenNotifications',
	},
	counter:
	{
		onNotificationCounterChange: 'onImUpdateCounterNotify',
		onChatCounterChange: 'onImUpdateCounterMessage',
		onImUpdateCounter: 'onImUpdateCounter',
		onUpdate: 'IM.Counters:onUpdate',
	},
	task:
	{
		onMembersCountChange: 'tasks:card:onMembersCountChange',
	},
	call:
	{
		onFold: 'CallController::onFold',
		onJoinFromRecentItem: 'IM.Call:onJoinFromRecentItem',
	},
	lines:
	{
		onInit: 'onLinesInit',
		openChat: 'openLinesChat',
		onChatOpen: 'onLinesChatOpen',
	},
	desktop:
	{
		onInit: 'onDesktopInit',
		onReload: 'onDesktopReload',
		onSyncPause: 'onDesktopSyncPause',
		onUserAway: 'BXUserAway',
		onWakeUp: 'BXWakeAction',
		onBxLink: 'BXProtocolUrl',
		onExit: 'BXExitApplication',
		onIconClick: 'BXApplicationClick',
		onNewTabClick: 'BXNewTabClick',
	},
};
