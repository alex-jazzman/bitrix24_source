/**
 * @module tasks/statemanager/redux/slices/templates/action
 */
jn.define('tasks/statemanager/redux/slices/templates/action', (require, exports, module) => {
	const { sliceName } = require('tasks/statemanager/redux/slices/templates/meta');
	const { createAction } = require('statemanager/redux/toolkit');

	const addTemplates = createAction(`${sliceName}/templatesAdded`);
	const upsertTemplates = createAction(`${sliceName}/templatesUpserted`);
	const setTemplatesSorting = createAction(`${sliceName}/templatesSortingSet`);
	const toggleTemplatesSorting = createAction(`${sliceName}/templatesSortingToggled`);

	module.exports = {
		addTemplates,
		upsertTemplates,
		setTemplatesSorting,
		toggleTemplatesSorting,
	};
});
