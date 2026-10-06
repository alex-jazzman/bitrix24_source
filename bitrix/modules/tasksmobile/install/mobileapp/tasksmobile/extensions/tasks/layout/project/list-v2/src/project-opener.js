/**
 * @module tasks/layout/project/list-v2/src/project-opener
 */
jn.define('tasks/layout/project/list-v2/src/project-opener', (require, exports, module) => {
	const { ProjectOpener } = require('project/opener');

	const PROJECT_RESTRICTION_COMPONENT_CODE = 'tasks.project.restriction';

	class ProjectListProjectOpener
	{
		/**
		 * @param {ProjectListProjectOpenerConfig} config
		 */
		constructor({ getPreloadedChatId })
		{
			this.getPreloadedChatId = getPreloadedChatId;
		}

		/**
		 * @param {number|string} projectId
		 * @returns {Promise<void>}
		 */
		open = async (projectId) => {
			projectId = Number(projectId);
			if (projectId <= 0)
			{
				return;
			}

			await ProjectOpener.open({
				projectId,
				chatId: this.getPreloadedChatId(projectId),
				onProjectAccessDenied: this.openRestriction,
			});
		};

		openRestriction()
		{
			const { publicUrl } = availableComponents[`tasks:${PROJECT_RESTRICTION_COMPONENT_CODE}`] ?? {};
			if (!publicUrl)
			{
				console.error('ProjectListProjectOpener.openRestriction: component is unavailable.');

				return;
			}

			PageManager.openComponent('JSStackComponent', {
				componentCode: PROJECT_RESTRICTION_COMPONENT_CODE,
				canOpenInDefault: true,
				scriptPath: publicUrl,
				rootWidget: {
					name: 'layout',
					settings: {
						objectName: 'layout',
					},
				},
				params: {
					COMPONENT_CODE: PROJECT_RESTRICTION_COMPONENT_CODE,
				},
			});
		}
	}

	module.exports = { ProjectListProjectOpener };
});
