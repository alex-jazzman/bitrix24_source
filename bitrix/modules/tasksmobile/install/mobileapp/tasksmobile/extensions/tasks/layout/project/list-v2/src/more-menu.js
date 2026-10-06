/**
 * @module tasks/layout/project/list-v2/src/more-menu
 */
jn.define('tasks/layout/project/list-v2/src/more-menu', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { BaseListMoreMenu } = require('layout/ui/list/base-more-menu');
	const { Loc } = require('loc');
	const { Color } = require('tokens');
	const {
		PROJECT_LIST_MODE,
		COUNTER_FILTER,
		READ_ALL_BUTTON_ID,
	} = require('tasks/layout/project/list-v2/src/constants');

	class TasksProjectListMoreMenu extends BaseListMoreMenu
	{
		/**
		 * @param {ProjectListCounters} counters
		 * @param {ProjectListCounterFilterId} selectedCounter
		 * @param {?string} selectedSorting
		 * @param {ProjectListMoreMenuCallbacks} callbacks
		 */
		constructor(
			counters,
			selectedCounter,
			selectedSorting,
			callbacks = {},
		)
		{
			super(counters, selectedCounter, selectedSorting, callbacks);

			this.onReadAllClick = callbacks.onReadAllClick;
		}

		getMenuButton()
		{
			return {
				type: 'more',
				id: 'tasks-project-list-v2-more',
				testId: 'tasks-project-list-v2-more',
				badgeCode: `${PROJECT_LIST_MODE}_MoreButton`,
				dot: this.hasCountersValue(),
				callback: this.openMoreMenu,
				accent: this.isCounterSelected(),
			};
		}

		isCounterSelected()
		{
			return this.selectedCounter !== COUNTER_FILTER.none;
		}

		hasCountersValue()
		{
			return (
				Number(this.counters[COUNTER_FILTER.sonetTotalExpired] ?? 0)
				+ Number(this.counters[COUNTER_FILTER.sonetTotalComments] ?? 0)
			) > 0;
		}

		getMenuItems()
		{
			return [
				this.createMenuItem({
					id: COUNTER_FILTER.sonetTotalExpired,
					title: Loc.getMessage('TASKSMOBILE_PROJECT_LIST_MORE_MENU_EXPIRED'),
					counterColor: Color.accentMainAlert.toHex(),
					sectionCode: 'my-counters',
					sectionTitle: Loc.getMessage('TASKSMOBILE_PROJECT_LIST_MORE_MENU_MY_COUNTERS_SECTION'),
					showIcon: false,
				}),
				this.createMenuItem({
					id: COUNTER_FILTER.sonetTotalComments,
					title: Loc.getMessage('TASKSMOBILE_PROJECT_LIST_MORE_MENU_COMMENTS'),
					counterColor: Color.accentMainSuccess.toHex(),
					sectionCode: 'my-counters',
					showIcon: false,
				}),
				this.createMenuItem({
					id: READ_ALL_BUTTON_ID,
					title: Loc.getMessage('TASKSMOBILE_PROJECT_LIST_MORE_MENU_READ_ALL'),
					icon: Icon.CHATS_WITH_CHECK,
					showTopSeparator: true,
					sectionCode: 'settings',
				}),
			];
		}

		onMenuItemSelected(event, item)
		{
			switch (item.id)
			{
				case COUNTER_FILTER.sonetTotalExpired:
				case COUNTER_FILTER.sonetTotalComments:
					this.onCounterClick(item.id);
					break;

				case READ_ALL_BUTTON_ID:
					this.onReadAllClick();
					break;

				default:
					break;
			}
		}
	}

	module.exports = {
		TasksProjectListMoreMenu,
	};
});
