/**
 * @module timeman/work-reports/review/list/src/filter-bar
 */
jn.define('timeman/work-reports/review/list/src/filter-bar', (require, exports, module) => {
	const { Icon } = require('assets/icons');
	const { Moment } = require('utils/date');
	const {
		openMonthPicker,
		openUserSelector,
	} = require('timeman/work-reports/actions');

	const TAB_SELECTED_EVENT = 'stafftrack.check-in-v2.tabs:onTabSelected';

	const ButtonId = Object.freeze({
		Filter: 'filter',
		Calendar: 'calendar',
	});

	class FilterBar
	{
		/** @param {FilterBarProps} props */
		constructor(props)
		{
			this.props = props;

			this.#subscribeFromEvents();
		}

		#subscribeFromEvents()
		{
			BX.addCustomEvent(TAB_SELECTED_EVENT, this.setupNavigationButtons);
		}

		/** @param {FilterBarProps} props */
		refresh(props)
		{
			this.props = { ...this.props, ...props };
			this.setupNavigationButtons();
		}

		#isFilterActive()
		{
			const { selectedUserIds } = this.props;

			return Array.isArray(selectedUserIds) && selectedUserIds.length > 0;
		}

		#isCalendarActive()
		{
			const { timestamp } = this.props;

			if (!timestamp)
			{
				return false;
			}

			const moment = new Moment(timestamp);

			return !moment.inThisMonth;
		}

		setupNavigationButtons = () => {
			const { parentWidget, hasOtherSubordinates, extraButtons } = this.props;
			const buttons = [];

			if (hasOtherSubordinates)
			{
				buttons.push({
					id: ButtonId.Filter,
					type: Icon.FILTER_2_LINES.getIconName(),
					accent: this.#isFilterActive(),
					callback: this.#handleFilterClick,
				});
			}

			buttons.push({
				id: ButtonId.Calendar,
				type: Icon.CALENDAR_WITH_SLOTS.getIconName(),
				accent: this.#isCalendarActive(),
				callback: this.#handleCalendarClick,
			});

			if (Array.isArray(extraButtons))
			{
				buttons.push(...extraButtons);
			}

			parentWidget?.setRightButtons?.(buttons);
		};

		#handleFilterClick = async () => {
			const { selectedUserIds, parentWidget, onUsersSelected } = this.props;

			const selectedUsers = await openUserSelector({
				selectedUserIds,
				parentWidget,
			});

			onUsersSelected?.(selectedUsers ?? []);
		};

		#handleCalendarClick = () => {
			const { timestamp, onMonthSelected } = this.props;

			openMonthPicker({
				timestamp,
				onPicked: (monthStart) => {
					onMonthSelected?.(monthStart);
				},
			});
		};
	}

	module.exports = { FilterBar };
});
