/**
 * @module crm/timeline/item/ui/footer
 */
jn.define('crm/timeline/item/ui/footer', (require, exports, module) => {
	const { Text4 } = require('ui-system/typography/text');
	const AppTheme = require('apptheme');
	const { TimelineItemContextMenu } = require('crm/timeline/item/ui/context-menu');
	const {
		TimelineButtonType,
		TimelineButtonVisibilityFilter,
		TimelineButtonSorter,
	} = require('crm/timeline/item/ui/styles');
	const { transparent, withPressed } = require('utils/color');
	const { get } = require('utils/object');
	const { Color } = require('tokens');
	const { Icon, IconView } = require('ui-system/blocks/icon');

	const nothing = () => {};

	const ICON_SIZE = 28;

	const MAX_BUTTONS_COUNT = 3;
	const MAX_ICONS_COUNT = 2;

	/**
	 * @class TimelineItemFooter
	 */
	class TimelineItemFooter extends LayoutComponent
	{
		/**
		 * @return {TimelineItemContextMenu}
		 */
		get menu()
		{
			return new TimelineItemContextMenu({
				items: this.availableMenuItems,
				onAction: (action) => this.onAction(action),
				isReadonly: this.props.isReadonly,
			});
		}

		/**
		 * @return {*[]}
		 */
		get availableButtons()
		{
			return Object.values(this.props.buttons || {})
				.filter((button) => TimelineButtonVisibilityFilter(button, this.props.isReadonly))
				.sort(TimelineButtonSorter);
		}

		/**
		 * @return {*[]}
		 */
		get displayedButtons()
		{
			return this.availableButtons.slice(0, MAX_BUTTONS_COUNT);
		}

		/**
		 * @return {*[]}
		 */
		get hiddenButtons()
		{
			return this.availableButtons.slice(MAX_BUTTONS_COUNT);
		}

		/**
		 * @return {*[]}
		 */
		get availableIcons()
		{
			return Object.values(this.props.additionalButtons || {})
				.filter((button) => TimelineButtonVisibilityFilter(button, this.props.isReadonly))
				.sort(TimelineButtonSorter);
		}

		/**
		 * @return {*[]}
		 */
		get displayedIcons()
		{
			return this.availableIcons.slice(0, MAX_ICONS_COUNT);
		}

		/**
		 * @return {*[]}
		 */
		get availableMenuItems()
		{
			const rawItems = Object.values(get(this.props, 'menu.items', {}));

			return [...rawItems, ...this.hiddenButtons];
		}

		render()
		{
			const hasButtons = this.displayedButtons.length > 0;
			const hasIconsOrMenu = hasButtons || this.menu.hasItems();

			if (!hasButtons && !hasIconsOrMenu)
			{
				return null;
			}

			return View(
				{
					style: {
						paddingHorizontal: 16,
						paddingTop: 0,
						paddingBottom: 12,
						flexDirection: 'row',
						flexWrap: 'wrap',
					},
				},
				...this.displayedButtons.map((button, index) => this.renderButton(button, index)),
				hasIconsOrMenu && View(
					{
						style: {
							width: this.displayedButtons.length % 2 === 0 ? '100%' : '50%',
							flexDirection: 'row',
							justifyContent: 'flex-end',
							marginBottom: 12,
						},
					},
					...this.displayedIcons.map((icon) => this.renderIcon(icon)),
					this.renderMenu(),
				),
			);
		}

		renderButton(button, index)
		{
			return View(
				{
					style: {
						width: '50%',
						marginBottom: 12,
						paddingRight: index % 2 === 0 ? 6 : 0,
						paddingLeft: index % 2 === 1 ? 6 : 0,
					},
				},
				TimelineItemButton({
					...button,
					onClick: () => this.onAction(button.action),
				}),
			);
		}

		renderIcon(icon)
		{
			const code = icon.iconName;
			const content = this.renderIconContent(icon, code);

			if (!content)
			{
				return null;
			}

			return View(
				{
					testId: `TimelineItemFooterIcon_${code}`,
					style: {
						flexDirection: 'column',
						justifyContent: 'center',
						paddingLeft: 12,
						paddingRight: 12,
						paddingTop: 5,
						paddingBottom: 5,
					},
					onClick: () => this.onAction(icon.action),
				},
				content,
			);
		}

		renderIconContent(icon, code)
		{
			if (!RegistryIcons[code])
			{
				return null;
			}

			return IconView({
				testId: `TimelineItemFooterIcon_${code}_icon`,
				icon: RegistryIcons[code],
				size: ICON_SIZE,
				color: IconColors[icon.color] || IconColors.default,
			});
		}

		renderMenu()
		{
			if (!this.menu.hasItems())
			{
				return null;
			}

			return View(
				{
					testId: 'TimelineItemFooterMenuIcon',
					style: {
						flexDirection: 'column',
						justifyContent: 'center',
						paddingLeft: 8,
						paddingRight: 4,
						// same vertical padding as the icons next to it: the row height must not grow
						paddingTop: 5,
						paddingBottom: 5,
					},
					onClick: () => this.menu.open(),
				},
				IconView({
					testId: 'TimelineItemFooterMenuIcon_icon',
					icon: Icon.MORE,
					size: ICON_SIZE,
					color: Color.base3,
				}),
			);
		}

		onAction(action)
		{
			if (action && this.props.onAction)
			{
				this.props.onAction(action);
			}
		}
	}

	function TimelineItemButton({ type, title, sort = 0, onClick = nothing })
	{
		return View(
			{
				onClick,
				testId: `TimelineItemFooterButton_${sort}_clickable`,
				style: {
					backgroundColor: getTimelineButtonBackground(type),
					borderRadius: 512,
					borderWidth: 1,
					borderColor: type === TimelineButtonType.PRIMARY ? AppTheme.colors.accentMainPrimary : AppTheme.colors.base3,
					paddingHorizontal: 16,
					paddingVertical: 10,
					flexDirection: 'row',
					justifyContent: 'center',
				},
			},
			Text4({
				text: title,
				testId: `TimelineItemFooterButton_${sort}_caption`,
				ellipsize: 'end',
				numberOfLines: 1,
				style: {
					color: type === TimelineButtonType.PRIMARY ? AppTheme.colors.baseWhiteFixed : AppTheme.colors.base1,
					fontWeight: '500',
				},
			}),
		);
	}

	function getTimelineButtonBackground(type)
	{
		if (type === TimelineButtonType.PRIMARY)
		{
			return withPressed(AppTheme.colors.accentMainPrimary);
		}

		const { default: defaultColor, pressed } = withPressed(AppTheme.colors.bgContentPrimary);

		return {
			default: transparent(defaultColor),
			pressed,
		};
	}

	const IconColors = {
		primary: Color.accentBrandBlue,
		default: Color.base3,
	};

	const RegistryIcons = {
		note: Icon.RECEIPT_NOTE,
		print: Icon.PRINTER,
		script: Icon.TRANSCRIPTION,
		videoconference: Icon.RECORD_VIDEO,
	};

	module.exports = { TimelineItemFooter };
});
