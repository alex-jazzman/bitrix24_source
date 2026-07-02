(() => {
	const require = (ext) => jn.require(ext);
	const { TasksTemplateList } = require('tasks/layout/template/list');

	BX.onViewLoaded(() => {
		layout.showComponent(
			new TasksTemplateList({}),
		);
	});
})();
