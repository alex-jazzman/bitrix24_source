(() => {
	const require = (ext) => jn.require(ext);
	const { TasksFlowList, ListType } = require('tasks/layout/flow/list');

	layout.showComponent(
		new TasksFlowList({
			currentUserId: Number(env.userId),
			listType: ListType.FLOWS,
		}),
	);
})();
