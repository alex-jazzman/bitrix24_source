/**
 * @module tasks/statemanager/redux/slices/project-list/src/action
 */
jn.define('tasks/statemanager/redux/slices/project-list/src/action', (require, exports, module) => {
	const { sliceName } = require('tasks/statemanager/redux/slices/project-list/meta');
	const { createAction } = require('statemanager/redux/toolkit');

	/** @type {ProjectListActionCreator} */
	const addProjectListItems = createAction(`${sliceName}/projectListAdded`);
	/** @type {ProjectListActionCreator} */
	const upsertProjectListItems = createAction(`${sliceName}/projectListUpserted`);
	/** @type {ProjectListActionCreator} */
	const removeProjectListItems = createAction(`${sliceName}/projectListRemoved`);
	/** @type {ProjectListActionCreator} */
	const clearProjectList = createAction(`${sliceName}/projectListCleared`);

	module.exports = {
		addProjectListItems,
		upsertProjectListItems,
		removeProjectListItems,
		clearProjectList,
	};
});
