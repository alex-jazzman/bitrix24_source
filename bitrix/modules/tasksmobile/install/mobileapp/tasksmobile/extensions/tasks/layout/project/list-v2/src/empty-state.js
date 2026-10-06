/**
 * @module tasks/layout/project/list-v2/src/empty-state
 */
jn.define('tasks/layout/project/list-v2/src/empty-state', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { makeLibraryImagePath } = require('asset-manager');
	const { AiLoc, Loc } = require('loc');
	const { StatusBlock } = require('ui-system/blocks/status-block');

	const EMPTY_STATE_IMAGE = 'project-list.png';
	const EMPTY_STATE_SEARCH_IMAGE = 'project-list-search.png';

	class ProjectListEmptyState
	{
		/**
		 * @param {ProjectListEmptyStateProps} props
		 */
		constructor({
			isSearchActive,
			isPortalProjectsEmpty,
			onRefresh,
			testId,
		})
		{
			this.isSearchActive = isSearchActive;
			this.isPortalProjectsEmpty = isPortalProjectsEmpty;
			this.onRefresh = onRefresh;
			this.testId = testId;
		}

		render()
		{
			return StatusBlock({
				testId: this.getTestId(),
				image: this.renderImage(),
				emptyScreen: true,
				onRefresh: this.onRefresh,
				...this.getProps(),
			});
		}

		getProps()
		{
			if (this.isSearchActive)
			{
				return {
					title: Loc.getMessage('TASKSMOBILE_PROJECT_LIST_EMPTY_SEARCH_TITLE'),
					description: Loc.getMessage('TASKSMOBILE_PROJECT_LIST_EMPTY_SEARCH_DESCRIPTION'),
				};
			}

			if (env.isAdmin && this.isPortalProjectsEmpty)
			{
				return {
					title: Loc.getMessage('TASKSMOBILE_PROJECT_LIST_EMPTY_PORTAL_TITLE'),
					list: [
						{
							icon: Icon.CHATS,
							text: Loc.getMessage('TASKSMOBILE_PROJECT_LIST_EMPTY_PORTAL_LIST_ITEM_CHATS'),
						},
						{
							icon: Icon.TASK,
							text: Loc.getMessage('TASKSMOBILE_PROJECT_LIST_EMPTY_PORTAL_LIST_ITEM_TASKS'),
						},
						{
							icon: Icon.THREE_PERSONS,
							text: AiLoc.getMessage('TASKSMOBILE_PROJECT_LIST_EMPTY_PORTAL_LIST_ITEM_GPT'),
						},
					],
				};
			}

			return {
				title: Loc.getMessage('TASKSMOBILE_PROJECT_LIST_EMPTY_USER_TITLE'),
				description: Loc.getMessage('TASKSMOBILE_PROJECT_LIST_EMPTY_USER_DESCRIPTION'),
			};
		}

		renderImage()
		{
			return Image({
				testId: this.getTestId('image'),
				resizeMode: 'contain',
				style: {
					width: 240,
					height: 180,
				},
				uri: makeLibraryImagePath(this.getImageName(), 'empty-states', 'tasks'),
			});
		}

		getImageName()
		{
			return this.isSearchActive ? EMPTY_STATE_SEARCH_IMAGE : EMPTY_STATE_IMAGE;
		}

		getTestId(suffix = '')
		{
			return suffix === ''
				? this.testId
				: `${this.testId}-${suffix}`;
		}
	}

	module.exports = { ProjectListEmptyState };
});
