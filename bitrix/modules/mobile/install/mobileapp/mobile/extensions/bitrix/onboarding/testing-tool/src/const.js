/**
 * @module onboarding/testing-tool/src/const
 */
jn.define('onboarding/testing-tool/src/const', (require, exports, module) => {
	const RegisteredCaseId = {
		MORE_THAN_SIX_TASKS: 'tasks:moreThanSixTasks',
		MORE_THAN_THREE_TASKS: 'tasks:moreThanThreeTasks',
		UNREAD_TASKS_COUNTERS: 'tasks:unreadTasksCounters',
		SUPPOSEDLY_COMPLETED_TASKS: 'tasks:supposedlyCompletedTasks',
		ON_MORE_THAN_THREE_CALENDAR_EVENTS: 'calendar:onMoreThanThreeEvents',
		ON_PROFILE_SHOULD_BE_FILLED: 'mobile:onProfileShouldBeFilled',
		IS_USER_ALONE: 'intranet:isUserAlone',
		ON_ONE_TO_ONE_CHAT_VIEW: 'immobile:onOneToOneChatView',
		ON_GROUP_CHAT_VIEW: 'immobile:onGroupChatView',
		ON_FILES_APPEARS_IN_CHAT: 'immobile:onFilesAppearsInChat',
		ON_NO_CRM_DEALS: 'crm.tabs:onEmptyCrm',
		ON_ACTIVE_TAB_COUNTER: 'crm.tabs:onActiveTabCounter',
		ON_DEALS_AT_DIFFERENT_STAGES: 'crm.tabs:onDealsAtDifferentStages',
		ON_MORE_THAN_TWO_TUNNELS: 'crm.tabs:onMoreThanTwoTunnels',
		ON_DEAL_CONTACT_FILLED: 'crm.tabs:onContactInDealFilled',
		ON_CUSTOM_PRESET_APPEARED: 'crm.tabs:onCustomPresetAppeared',
		ON_PAYMENT_ON_DEAL: 'crm.entity.detail:onPaymentEnabled',
		ON_DETAIL_CARD_TELEGRAM_BOT: 'mobile:onDetailCardTelegramBot',
	};

	const TestRequestKey = {
		SHOULD_USE_TAB_SYNC: 'shouldUseTabSync',
	};

	module.exports = {
		RegisteredCaseId,
		TestRequestKey,
	};
});
