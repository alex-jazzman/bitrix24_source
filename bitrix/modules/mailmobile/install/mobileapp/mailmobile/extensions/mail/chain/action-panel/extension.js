/**
 * @module mail/chain/action-panel
 */
jn.define('mail/chain/action-panel', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { ScrollView } = require('layout/ui/scroll-view');
	const { throttle } = require('utils/function');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Switcher, SwitcherSize } = require('ui-system/blocks/switcher');
	const { Text3 } = require('ui-system/typography/text');
	const {
		Color,
		Component,
		Indent,
		Typography,
	} = require('tokens');
	const height = 66;
	const actionIconSize = Component.itbChipHeight.toNumber() - Indent.XS2.toNumber();
	const toolbarIconSize = Indent.XL4.toNumber();

	const actionIcon = (icon) => ({ icon, color: Color.base1, size: actionIconSize });
	const toolbarIcon = (icon, color = Color.base2) => ({ icon, color, size: toolbarIconSize });

	const buttonIcons = {
		replyButton: actionIcon(Icon.REPLY_2),
		replyAllButton: actionIcon(Icon.REPLY_TO_ALL),
		forwardButton: actionIcon(Icon.FORWARD),
		moreButton: actionIcon(Icon.MORE),
		attachmentsButton: toolbarIcon(Icon.ATTACH),
		templatesButton: toolbarIcon(Icon.TEMPLATE_TASK),
		calendarSlotsButton: toolbarIcon(Icon.CALENDAR_WITH_SLOTS),
		calendarSlotsRestrictedButton: toolbarIcon(Icon.CALENDAR_WITH_SLOTS, Color.base4),
	};

	const titles = {
		buttons: {
			replyButton: BX.message('MESSAGE_CHAIN_ACTION_PANEL_CONTEXT_MENU_REPLY'),
			replyAllButton: BX.message('MESSAGE_CHAIN_ACTION_PANEL_CONTEXT_MENU_REPLY_ALL'),
			forwardButton: BX.message('MESSAGE_CHAIN_ACTION_PANEL_CONTEXT_MENU_FORWARD'),
			moreButton: BX.message('MESSAGE_CHAIN_ACTION_PANEL_CONTEXT_MENU_MORE'),
			attachmentsButton: BX.message('MESSAGE_CHAIN_ACTION_PANEL_FILE'),
			templatesButton: BX.message('MESSAGE_CHAIN_ACTION_PANEL_TEMPLATES'),
			calendarSlotsButton: BX.message('MESSAGE_CHAIN_ACTION_PANEL_CALENDAR_SLOTS'),
			calendarSlotsRestrictedButton: BX.message('MESSAGE_CHAIN_ACTION_PANEL_CALENDAR_SLOTS'),
		},
	};

	function TitleButton(text, circleWrap = false, buttonKey = null, selected = false)
	{
		if (text)
		{
			const isRestricted = buttonKey === 'calendarSlotsRestrictedButton';

			return Text({
				style: {
					alignSelf: 'center',
					marginLeft: circleWrap ? Component.itbBoxGap.toNumber() : 0,
					...(
						circleWrap
							? Typography.body3Style.getStyle()
							: Typography.body6AccentStyle.getStyle()
					),
					color: circleWrap
						? (selected ? Color.accentMainPrimary : (isRestricted ? Color.base4 : Color.base2)).toHex()
						: Color.base1.toHex()
					,
				},
				text,
			});
		}

		return null;
	}

	class SaveTemplateToggle extends PureComponent
	{
		render()
		{
			const { checked, text, onToggle } = this.props;

			return View(
				{
					testId: 'message-sending-form-save-template',
					onClick: () => onToggle(!checked),
					accessibilityLabel: text,
					accessibilityRole: 'switch',
					accessibilityState: { checked: Boolean(checked) },
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						paddingHorizontal: Indent.XL3.toNumber(),
						paddingVertical: Indent.M.toNumber(),
					},
				},
				Text3({
					testId: 'message-sending-form-save-template-label',
					text,
					color: Color.base1,
				}),
				Switcher({
					testId: 'message-sending-form-save-template-toggle',
					accessibilityLabel: text,
					checked: Boolean(checked),
					useState: false,
					size: SwitcherSize.L,
				}),
			);
		}
	}

	function Button(props)
	{
		const {
			circleWrap,
			buttonKey,
			selected,
			title = titles.buttons[buttonKey],
		} = props;
		const isRestricted = buttonKey === 'calendarSlotsRestrictedButton';
		const isSelected = selected === true;

		let {
			action,
		} = props;
		const buttonIcon = buttonIcons[buttonKey];

		if (!buttonIcon)
		{
			return null;
		}

		action = throttle(action, 500, this);
		let buttonRef = null;

		let wrapStyle = {};

		let shadowProps = {};

		if (circleWrap)
		{
			wrapStyle = {
				alignSelf: 'center',
				flexDirection: 'row',
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: (isSelected ? Color.accentSoftBlue2 : Color.bgPrimary).toHex(),
				borderWidth: Component.itbChipStroke.toNumber(),
				borderColor: (
					isSelected ? Color.accentSoftBorderBlue : (isRestricted ? Color.base7 : Color.base6)
				).toHex(),
				borderRadius: Component.itbChipCorner.toNumber(),
				height: Component.itbChipHeight.toNumber(),
				paddingLeft: Component.itbChipPaddingLrLess.toNumber(),
				paddingRight: Component.itbChipPaddingLr.toNumber(),
			};

			shadowProps = {
				style: {
					marginLeft: Indent.S.toNumber(),
					marginRight: Indent.S.toNumber(),
				},
			};
		}

		return View(
			shadowProps,
			View(
				{
					ref: (ref) => {
						buttonRef = ref;
					},
					testId: (`mail-action-panel-button-${buttonKey}`),
					accessibilityLabel: title,
					accessibilityRole: 'button',
					accessibilityState: typeof selected === 'boolean' ? { selected: isSelected } : undefined,
					onClick: () => {
						action(buttonRef);
					},
					style: {
						...wrapStyle,
						marginLeft: circleWrap ? 0 : Component.itbBoxGap.toNumber(),
						marginRight: circleWrap ? 0 : Component.itbBoxGap.toNumber(),
					},
				},
				IconView({
					style: { alignSelf: 'center' },
					icon: buttonIcon.icon,
					color: isSelected ? Color.accentMainPrimary : buttonIcon.color,
					size: buttonIcon.size,
				}),
				TitleButton(title, circleWrap, buttonKey, isSelected),
			),
		);
	}

	class ActionPanel extends PureComponent
	{
		constructor(props)
		{
			super(props);

			const { actions } = props;

			this.actions = actions;
		}

		render()
		{
			if (this.props.indentStub)
			{
				return View({
					style: {
						height: (height * 1.5),
					},
				});
			}

			let style = {};

			if (this.props.withoutStyles)
			{
				style = {
					width: '100%',
					paddingLeft: 12,
					paddingRight: 12,
					paddingTop: 6,
					paddingBottom: 6,
					height,
				};
			}
			else
			{
				style = {
					width: '100%',
					paddingLeft: 12,
					paddingRight: 12,
					paddingTop: 6,
					paddingBottom: 6,
					backgroundColor: Color.bgNavigation.toHex(),
					height,
				};
			}

			const buttons = Object.entries(this.actions).map(([key, value]) => {
				return Button({
					circleWrap: this.props.withoutStyles,
					buttonKey: key,
					action: value,
				});
			});

			let justifyContent = 'flex-end';

			if (buttons.length >= 3)
			{
				justifyContent = 'space-around';
			}

			if (this.props.withoutStyles)
			{
				return View(
					{
						testId: 'mail-action-panel-compose',
						safeArea: {
							bottom: true,
							top: false,
							left: false,
							right: false,
						},
						style: {
							left: 0,
							right: 0,
							bottom: 0,
							marginBottom: Indent.M.toNumber(),
							position: 'absolute',
							flexDirection: 'row',
							alignItems: 'center',
						},
					},
					ScrollView(
						{
							testId: 'mail-action-panel-scroll',
							horizontal: true,
							bounces: false,
							showsHorizontalScrollIndicator: false,
							style: {
								flex: 1,
								height: Component.itbChipHeight.toNumber(),
							},
						},
						...buttons,
					),
				);
			}

			return View(
				{
					safeArea: {
						bottom: true,
						top: false,
						left: false,
						right: false,
					},
					style: {
						bottom: 0,
						position: 'absolute',
						width: '100%',
					},
				},
				View(
					{
						style,
					},
					View(
						{
							style: {
								flex: 1,
								justifyContent,
								flexDirection: 'row',
								alignItems: 'center',
							},
						},
						...buttons,
					),
				),
			);
		}
	}

	module.exports = { ActionPanel, SaveTemplateToggle };
});
