/**
 * @module call/callList/item
 */
jn.define('call/callList/item', (require, exports, module) => {
	const { BadgeCounter, BadgeCounterSize, BadgeCounterDesign } = require('ui-system/blocks/badges/counter');
	const { formatDuration } = require('call/callList/utils');
	const { CallLogType } = require('call/const');
	const { Color } = require('tokens');

	const ICONS = Object.freeze({
		incoming: 'phone_in',
		outgoing: 'phone_out',
		missed: 'phone_broken',
	});

	const TYPE = CallLogType.Type;
	const STATUS = CallLogType.Status;

	class CallListItemComponent extends LayoutComponent
	{
		constructor(props)
		{
			super(props);
			this.state = { pressed: false };
		}

		getSubtitleText(item)
		{
			const timeStr = (item.duration > 0) ? formatDuration(item.duration) : '';

			if (item.status === STATUS.MISSED)
			{
				return BX.message('MOBILEAPP_CALL_LIST_MISSED_TYPE');
			}

			if (item.type === TYPE.INCOMING)
			{
				return timeStr
					? BX.message('MOBILEAPP_CALL_LIST_MISSED_INCOMING_TIME').replace('#TIME#', timeStr)
					: BX.message('MOBILEAPP_CALL_LIST_MISSED_INCOMING');
			}

			if (item.type === TYPE.OUTGOING)
			{
				return timeStr
					? BX.message('MOBILEAPP_CALL_LIST_MISSED_OUTGOING_TIME').replace('#TIME#', timeStr)
					: BX.message('MOBILEAPP_CALL_LIST_MISSED_OUTGOING');
			}

			return BX.message('MOBILEAPP_CALL_LIST_MISSED_OUTGOING');
		}

		getCallIcon(item)
		{
			let iconName = ICONS.outgoing;

			if (item.status === STATUS.MISSED)
			{
				iconName = ICONS.missed;
			}
			else if (item.type === TYPE.INCOMING)
			{
				iconName = ICONS.incoming;
			}
			else if (item.type === TYPE.OUTGOING)
			{
				iconName = ICONS.outgoing;
			}

			return `${currentDomain}/bitrix/images/mobile/icons/${iconName}.svg`;
		}

		render()
		{
			const { item, timeLabel, titleColor, showMissedBadge, onClick } = this.props;

			const subtitleComponent = View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				Image({
					style: {
						width: 18,
						height: 18,
						marginRight: 2,
					},
					tintColor: Color.base3.toHex(),
					svg: {
						uri: this.getCallIcon(item),
					},
				}),
				Text({
					text: this.getSubtitleText(item),
					style: {
						color: Color.base4.toHex(),
						fontSize: 15,
					},
				}),
			);

			return View(
				{
					style: {
						paddingTop: 8,
						paddingBottom: 1,
						paddingHorizontal: 18,
						position: 'relative',
					},
					onClick: () => {
						this.setState({ pressed: true });
						setTimeout(() => this.setState({ pressed: false }), 300);
						if (typeof onClick === 'function')
						{
							onClick();
						}
					},
				},
				View(
					{
						style: { flexDirection: 'row' },
					},
					this.renderAvatar(),
					View(
						{
							style: {
								flex: 1,
							},
						},
						Text({
							text: item.phoneNumber || item.title,
							style: { color: titleColor, fontSize: 16, fontWeight: '600', marginBottom: 4 },
						}),
						subtitleComponent,
					),
					View(
						{
							style: {
								justifyContent: 'flex-start',
								alignItems: 'flex-end',
								paddingTop: 2,
							},
						},
						Text({
							text: timeLabel,
							style: {
								color: Color.base3.toHex(),
								fontSize: 13,
							},
						}),
						(showMissedBadge
							? View(
								{
									style: {
										justifyContent: 'flex-end',
										alignItems: 'flex-end',
										marginTop: 8,
									},
								},
								BadgeCounter({
									value: '1',
									size: BadgeCounterSize.S,
									design: BadgeCounterDesign.ALERT,
								}),
							)
							: null
						),
					),
				),
				View(
					{
						style: {
							flexDirection: 'row',
							alignItems: 'center',
							marginTop: 12,
						},
					},
					View({
						style: { width: 62, height: 1 },
					}),
					View({
						style: {
							flex: 1,
							height: 1,
							backgroundColor: Color.bgSeparatorSecondary.toHex(),
						},
					}),
				),
				(this.state.pressed
					? View({
						style: {
							position: 'absolute',
							left: 0,
							right: 0,
							top: 0,
							bottom: 0,
							backgroundColor: Color.base1.toHex(),
							opacity: 0.1,
							zIndex: 1000,
							pointerEvents: 'none',
						},
					})
					: null
				),
			);
		}

		renderAvatar()
		{
			const { item, avatarBg } = this.props;
			const isTelephony = item.sourceType === 'voximplant' || item.phone;
			const avatarRel = String(item.avatar || '');
			const isBlankAvatar = avatarRel === '' || avatarRel.includes('/blank');

			const avatarUri = (!isBlankAvatar && avatarRel
				? (avatarRel.startsWith('http') ? avatarRel : `${currentDomain}${avatarRel}`)
				: ''
			);

			const avatarStyle = {
				width: 56,
				height: 56,
				borderRadius: 100,
				marginRight: 10,
				backgroundColor: isTelephony ? Color.accentMainPrimary.toHex() : avatarBg,
				justifyContent: 'center',
				alignItems: 'center',
			};

			// For telephony show user icon
			if (isTelephony)
			{
				return View(
					{
						style: avatarStyle,
					},
					Image({
						style: {
							width: 30,
							height: 30,
						},
						svg: {
							uri: `${currentDomain}/bitrix/images/mobile/icons/person.svg`,
						},
						tintColor: Color.baseWhiteFixed.toHex(),
					}),
				);
			}

			if (avatarUri)
			{
				return Image({
					style: avatarStyle,
					uri: avatarUri,
					resizeMode: 'cover',
				});
			}

			return View(
				{
					style: avatarStyle,
				},
				Text({
					text: item.title.slice(0, 2).toUpperCase(),
					style: {
						color: Color.baseWhiteFixed.toHex(),
						fontWeight: '600',
						fontSize: 20,
					},
				}),
			);
		}
	}

	function CallListItem(props)
	{
		return new CallListItemComponent(props);
	}

	module.exports = { CallListItem };
});
