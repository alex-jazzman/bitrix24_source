/**
 * @module tasks/in-app-url/routes/src/project-routes
 */
jn.define('tasks/in-app-url/routes/src/project-routes', (require, exports, module) => {
	const { checkFeatureFlag, FeatureFlagType } = require('feature-flag');
	const { getFeatureRestriction, tariffPlanRestrictionsReady } = require('tariff-plan-restriction');

	const PROJECTS_LIST_COMPONENT = 'tasks:tasks.project.list';
	const NEW_PROJECTS_LIST_COMPONENT = 'tasks:tasks.project.list.v2';

	/**
	 * @param {InAppUrl} inAppUrl
	 */
	function registerProjectRoutes(inAppUrl)
	{
		inAppUrl.register('/projects/', async (params, { context }) => {
			await tariffPlanRestrictionsReady();
			const { showRestriction, isRestricted } = getFeatureRestriction('socialnetwork_projects_groups');

			if (isRestricted())
			{
				showRestriction();

				return;
			}

			const { title } = context;
			const componentCode = await getProjectsListComponentCode();
			// eslint-disable-next-line no-undef
			const { publicUrl } = availableComponents[componentCode] ?? availableComponents[PROJECTS_LIST_COMPONENT];

			PageManager.openComponent('JSStackComponent', {
				componentCode,
				scriptPath: publicUrl,
				params: {
					SITE_ID: env.siteId,
					SITE_DIR: env.siteDir,
					USER_ID: env.userId,
					MODE: 'tasks_project',
					NAVIGATION_TITLE: title,
				},
				rootWidget: getProjectsListRootWidget(componentCode, title),
			});
		}).name('tasks:projects');
	}

	async function getProjectsListComponentCode()
	{
		try
		{
			const isNewProjectsListEnabled = await checkFeatureFlag(FeatureFlagType.PROJECTS_V2);
			// eslint-disable-next-line no-undef
			const hasNewProjectsListComponent = Boolean(availableComponents[NEW_PROJECTS_LIST_COMPONENT]?.publicUrl);

			if (isNewProjectsListEnabled && hasNewProjectsListComponent)
			{
				return NEW_PROJECTS_LIST_COMPONENT;
			}
		}
		catch (error)
		{
			console.error(error);
		}

		return PROJECTS_LIST_COMPONENT;
	}

	function getProjectsListRootWidget(componentCode, title)
	{
		if (componentCode === NEW_PROJECTS_LIST_COMPONENT)
		{
			return {
				name: 'layout',
				settings: {
					objectName: 'layout',
					title,
					useLargeTitleMode: true,
				},
			};
		}

		return {
			name: 'tasks.list',
			settings: {
				objectName: 'list',
				title,
				useSearch: true,
				useLargeTitleMode: true,
				emptyListMode: true,
			},
		};
	}

	module.exports = { registerProjectRoutes };
});
