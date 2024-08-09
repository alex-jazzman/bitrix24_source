(() => {
	const require = (ext) => jn.require(ext);

	const { guid: uuid } = require('utils/guid');
	const { TaskView } = require('tasks/layout/task/view-new');

	BX.onViewLoaded(() => {
		const userId = parseInt(BX.componentParameters.get('USER_ID', 0), 10);
		const taskId = BX.componentParameters.get('TASK_ID', 0);
		const guid = (BX.componentParameters.get('GUID') || uuid());
		const context = BX.componentParameters.get('CONTEXT');
		const shouldOpenComments = BX.componentParameters.get('SHOULD_OPEN_COMMENTS', false);

		layout.showComponent(
			new TaskView({
				layout,
				userId,
				taskId,
				guid,
				context,
				shouldOpenComments,
			}),
		);
	});
})();
