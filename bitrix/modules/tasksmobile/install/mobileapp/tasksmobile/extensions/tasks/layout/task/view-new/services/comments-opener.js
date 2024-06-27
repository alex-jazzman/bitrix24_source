/**
 * @module tasks/layout/task/view-new/services/comments-opener
 */
jn.define('tasks/layout/task/view-new/services/comments-opener', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { guid } = require('utils/guid');

	class CommentsOpener
	{
		constructor()
		{
			this.widgetGuid = guid();
		}

		openCommentsWidget(taskId)
		{
			PageManager.openPage({
				backgroundColor: Color.bgSecondary.toHex(),
				url: `${env.siteDir}mobile/tasks/snmrouter/?routePage=comments&TASK_ID=${taskId}&IS_TABS_MODE=false&widgetGuid=${this.widgetGuid}`,
				backdrop: {
					mediumPositionPercent: 84,
					onlyMediumPosition: true,
					forceDismissOnSwipeDown: true,
					swipeAllowed: true,
					swipeContentAllowed: true,
					horizontalSwipeAllowed: false,
					navigationBarColor: Color.bgSecondary.toHex(),
					enableNavigationBarBorder: false,
				},
				titleParams: {
					text: Loc.getMessage('M_TASK_DETAILS_COMMENTS_TITLE'),
					type: 'dialog',
				},
				enableNavigationBarBorder: false,
				loading: {
					type: 'comments',
				},
				modal: true,
				cache: true,
			});
		}
	}

	module.exports = { CommentsOpener };
});
