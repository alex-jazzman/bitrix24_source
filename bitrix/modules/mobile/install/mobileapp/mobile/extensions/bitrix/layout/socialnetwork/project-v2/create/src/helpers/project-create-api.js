/**
 * @module layout/socialnetwork/project-v2/create/src/helpers/project-create-api
 */
jn.define('layout/socialnetwork/project-v2/create/src/helpers/project-create-api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { buildProjectPayload } = require('layout/socialnetwork/project-v2/create/src/helpers/project-create-settings');

	const callProjectAction = async (action, options = {}) => {
		const response = await (new RunActionExecutor(action, options))
			.enableJson()
			.call(false);

		if (response?.errors?.length > 0)
		{
			return Promise.reject(response);
		}

		return response;
	};

	const getActionData = async (action, options = {}) => {
		const response = await callProjectAction(action, options);

		return response?.data ?? {};
	};

	const ProjectCreateApi = {
		getCreateSettings()
		{
			return getActionData('mobile.Project.getCreateSettings');
		},

		getEditSettings(projectId)
		{
			return getActionData('mobile.Project.getEditSettings', {
				projectId,
			});
		},

		create(settings)
		{
			return callProjectAction('mobile.Project.create', {
				fields: buildProjectPayload(settings),
			});
		},

		update(projectId, settings)
		{
			return callProjectAction('mobile.Project.update', {
				projectId,
				fields: buildProjectPayload(settings, true),
			});
		},
	};

	module.exports = { ProjectCreateApi };
});
