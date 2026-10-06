(() => {
	const require = (ext) => jn.require(ext);
	const { triggerNewProjectsPromo } = require('new-projects-promo/trigger');
	const { TasksProjectListV2 } = require('tasks/layout/project/list-v2');

	BX.onViewLoaded(() => {
		layout.showComponent(
			new TasksProjectListV2({}),
		);
		triggerNewProjectsPromo();
	});
})();
