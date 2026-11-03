/**
 * @module timeman/work-reports/actions/src/user-selector
 */
jn.define('timeman/work-reports/actions/src/user-selector', (require, exports, module) => {
	const { Loc } = require('timeman/work-reports/loc');
	const { normalizeUserIds } = require('timeman/work-reports/utils');
	const { FullReportUserSelector } = require('timeman/selector/entity/full-report-user');
	const { dispatch } = require('statemanager/redux/store');
	const { usersUpsertedFromEntitySelector } = require('statemanager/redux/slices/users');

	/**
	 * @param {OpenUserSelectorParams} params
	 * @returns {Promise<object[]>}
	 */
	function openUserSelector({ selectedUserIds, parentWidget } = {})
	{
		return new Promise((resolve) => {
			FullReportUserSelector.make({
				initSelectedIds: normalizeUserIds(selectedUserIds),
				createOptions: {
					enableCreation: false,
				},
				allowMultipleSelection: true,
				closeOnSelect: false,
				provider: {
					context: 'TIMEMAN_WORK_REPORTS_USER_SELECTOR',
					options: {
						recentItemsLimit: 20,
						maxUsersInRecentTab: 20,
					},
				},
				events: {
					onClose: (selectedUsers) => {
						if (Array.isArray(selectedUsers) && selectedUsers.length > 0)
						{
							dispatch(usersUpsertedFromEntitySelector(selectedUsers));
							resolve(selectedUsers);

							return;
						}

						resolve([]);
					},
				},
				widgetParams: {
					title: Loc.getMessage('M_TIMEMAN_WORK_REPORTS_USER_SELECTOR_TITLE'),
					backdrop: {
						mediumPositionPercent: 70,
						horizontalSwipeAllowed: false,
					},
				},
			}).show({}, parentWidget ?? PageManager).catch((error) => {
				console.error(error);
				resolve([]);
			});
		});
	}

	module.exports = {
		openUserSelector,
	};
});
