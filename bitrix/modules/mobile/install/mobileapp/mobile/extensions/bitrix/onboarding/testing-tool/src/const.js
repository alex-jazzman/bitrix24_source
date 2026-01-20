/**
 * @module onboarding/testing-tool/src/const
 */
jn.define('onboarding/testing-tool/src/const', (require, exports, module) => {
	const RegisteredCaseId = {
		ON_EMPTY_TASK_LIST: 'tasks:onEmptyTaskList',
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
	};

	const TestRequestKey = {
		SHOULD_USE_TAB_SYNC: 'shouldUseTabSync',
	};

	module.exports = {
		RegisteredCaseId,
		TestRequestKey,
	};
});
