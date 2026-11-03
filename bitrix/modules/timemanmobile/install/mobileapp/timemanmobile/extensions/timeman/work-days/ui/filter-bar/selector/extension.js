/**
 * @module timeman/work-days/ui/filter-bar/selector
 */
jn.define('timeman/work-days/ui/filter-bar/selector', (require, exports, module) => {
	const { Loc } = require('loc');
	const { FullReportUserSelector } = require('timeman/selector/entity/full-report-user');
	const { dispatch } = require('statemanager/redux/store');
	const { usersUpsertedFromEntitySelector } = require('statemanager/redux/slices/users');

	/**
	 * @param {{ selectedUserId?: number, parentWidget?: object }} params
	 * @returns {Promise<object|null>}
	 */
	function openUserSelector({ selectedUserId, parentWidget } = {})
	{
		return new Promise((resolve) => {
			FullReportUserSelector.make({
				initSelectedIds: selectedUserId ? [selectedUserId] : [],
				createOptions: {
					enableCreation: false,
				},
				allowMultipleSelection: false,
				closeOnSelect: true,
				provider: {
					context: 'TIMEMAN_WORK_DAYS_USER_SELECTOR',
					options: {
						recentItemsLimit: 20,
						maxUsersInRecentTab: 20,
					},
				},
				events: {
					onClose: (selectedUsers) => {
						if (Array.isArray(selectedUsers) && selectedUsers.length > 0)
						{
							const [user] = selectedUsers;
							dispatch(usersUpsertedFromEntitySelector([user]));
							resolve(user);

							return;
						}

						resolve(null);
					},
				},
				widgetParams: {
					title: Loc.getMessage('M_TIMEMAN_WORK_DAYS_USER_SELECTOR_TITLE'),
					backdrop: {
						mediumPositionPercent: 70,
						horizontalSwipeAllowed: false,
					},
				},
			}).show({}, parentWidget ?? PageManager).catch((error) => {
				console.error(error);
				resolve(null);
			});
		});
	}

	module.exports = { openUserSelector };
});
