/**
 * @module tasks/onboarding/src/const
 */
jn.define('tasks/onboarding/src/const', (require, exports, module) => {
	const CaseName = {
		ON_EMPTY_TASK_LIST: 'tasks:onEmptyTaskList',
		MORE_THAN_SIX_TASKS: 'tasks:moreThanSixTasks',
		MORE_THAN_THREE_TASKS: 'tasks:moreThanThreeTasks',
		UNREAD_TASKS_COUNTERS: 'tasks:unreadTasksCounters',
		SUPPOSEDLY_COMPLETED_TASKS: 'tasks:supposedlyCompletedTasks',
	};

	module.exports = {
		CaseName,
	};
});
