/**
 * @module timeman/work-days/ui/filter-bar
 */
jn.define('timeman/work-days/ui/filter-bar', (require, exports, module) => {
	const { Color, Indent, Component } = require('tokens');
	const { Text4 } = require('ui-system/typography/text');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Link4, LinkDesign } = require('ui-system/blocks/link');
	const { Line } = require('utils/skeleton');
	const { Moment } = require('utils/date');
	const { capitalize } = require('utils/string');
	const { monthYear } = require('utils/date/formats');
	const { createTestIdGenerator } = require('utils/test');
	const { Loc } = require('loc');
	const { openUserSelector } = require('timeman/work-days/ui/filter-bar/selector');

	class FilterBar extends LayoutComponent
	{
		/**
		 * @param {FilterBarProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({ prefix: 'filter', context: this });
		}

		render()
		{
			return View(
				{
					testId: this.getTestId(),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						paddingHorizontal: Component.paddingLr.toNumber(),
						paddingVertical: Indent.M.toNumber(),
					},
				},
				this.#renderUserSelector(),
				this.#renderMonthSelector(),
			);
		}

		#renderUserSelector()
		{
			const { userId, user } = this.props;

			return View(
				{
					testId: this.getTestId('user'),
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						flex: 1,
					},
					onClick: this.#handleUserSelectorClick,
				},
				Avatar({
					testId: this.getTestId('avatar'),
					id: userId,
					name: user?.fullName,
					uri: user?.avatarSize100,
					size: 18,
					withRedux: false,
				}),
				View(
					{
						style: {
							marginLeft: Indent.S.toNumber(),
							flexShrink: 2,
						},
					},
					user
						? Text4({
							testId: this.getTestId('username'),
							text: user.name,
							color: Color.base1,
							numberOfLines: 1,
							ellipsize: 'end',
							style: {
								flexShrink: 2,
							},
						})
						: Line(85, 18),
				),
				IconView({
					testId: this.getTestId('user-chevron'),
					icon: Icon.CHEVRON_DOWN,
					color: Color.base1,
					size: 20,
				}),
			);
		}

		#handleUserSelectorClick = async () => {
			const { userId, parentWidget, onUserSelected } = this.props;

			const user = await openUserSelector({
				selectedUserId: userId,
				parentWidget,
			});

			if (user)
			{
				onUserSelected?.(user);
			}
		};

		#handleMonthSelectorClick = () => {
			const { timestamp, onMonthSelected } = this.props;

			dialogs.showDatePicker(
				{
					title: Loc.getMessage('M_TIMEMAN_WORK_DAYS_MONTH_PICKER_TITLE'),
					type: 'monthyear',
					value: timestamp,
					dateFormat: 'LLLL Y',
				},
				(eventName, selectedTimestamp) => {
					if (eventName === 'onPick' && selectedTimestamp)
					{
						onMonthSelected(selectedTimestamp);
					}
				},
			);
		};

		#renderMonthSelector()
		{
			const { timestamp } = this.props;
			const moment = new Moment(timestamp);
			const text = capitalize(moment.format(monthYear));

			return Link4({
				testId: this.getTestId('month'),
				text,
				design: LinkDesign.BLACK,
				rightIcon: Icon.CHEVRON_DOWN,
				onClick: this.#handleMonthSelectorClick,
			});
		}
	}

	module.exports = { FilterBar };
});
