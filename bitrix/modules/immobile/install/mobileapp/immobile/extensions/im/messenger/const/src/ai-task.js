/**
 * @module im/messenger/const/ai-task
 */
jn.define('im/messenger/const/ai-task', (require, exports, module) => {
	const AiTasksStatusType = {
		search: 'search',
		taskCreationStarted: 'taskCreationStarted',
		taskCreationCompleted: 'taskCreationCompleted',
		resultCreationStarted: 'resultCreationStarted',
		resultCreationCompleted: 'resultCreationCompleted',
		notFound: 'notFound',
		animationInterrupted: 'animationInterrupted',
	};

	module.exports = { AiTasksStatusType };
});
