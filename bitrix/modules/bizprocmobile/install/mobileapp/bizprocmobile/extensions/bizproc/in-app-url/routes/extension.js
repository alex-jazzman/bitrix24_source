/**
 * @module bizproc/in-app-url/routes
 */
jn.define('bizproc/in-app-url/routes', (require, exports, module) => {
	const openTask = (taskOrWorkflowId, targetUserId, context) => {
		void requireLazy('bizproc:workflow/info')
			.then(({ WorkflowInfo }) => {
				const isTaskId = String(parseInt(taskOrWorkflowId, 10)) === taskOrWorkflowId;
				const isCorrectUserId = String(parseInt(targetUserId, 10)) === targetUserId;

				if (WorkflowInfo)
				{
					void WorkflowInfo.open(
						{
							workflowId: isTaskId ? null : taskOrWorkflowId,
							taskId: isTaskId ? parseInt(taskOrWorkflowId, 10) : null,
							targetUserId: isCorrectUserId ? parseInt(targetUserId, 10) : null,
						},
						context.parentWidget || PageManager,
					);
				}
			})
		;
	};

	/**
	 * @param {InAppUrl} inAppUrl
	 */
	module.exports = (inAppUrl) => {
		inAppUrl
			.register(
				'/company/personal/bizproc/:taskOrWorkflowId/$',
				({ taskOrWorkflowId }, { context }) => {
					openTask(taskOrWorkflowId, null, context);
				},
			)
			.name('bizproc:myWorkflow')
		;
		inAppUrl
			.register(
				'/company/personal/bizproc/:taskOrWorkflowId/\\?USER_ID=:userId',
				({ taskOrWorkflowId, userId }, { context }) => {
					openTask(taskOrWorkflowId, userId, context);
				},
			)
			.name('bizproc:workflow')
		;
		inAppUrl
			.register(
				'/bizproc/userprocesses/',
				(pathParams, props) => {
					// eslint-disable-next-line no-undef
					ComponentHelper.openLayout(
						{
							name: 'bizproc:tab',
							canOpenInDefault: true,
							componentParams: {
								setTitle: true,
							},
							object: 'layout',
						},
					);
				},
			)
			.name('bizproc:tab')
		;
	};
});
