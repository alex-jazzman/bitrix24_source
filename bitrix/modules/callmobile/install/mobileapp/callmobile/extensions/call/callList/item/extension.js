/**
 * @module call/callList/item
 */
jn.define('call/callList/item', (require, exports, module) => {
	const { BadgeCounter, BadgeCounterSize, BadgeCounterDesign } = require('ui-system/blocks/badges/counter');
	const { Text1, Text3, Text4, Text5 } = require('ui-system/typography/text');
	const { formatDuration, getFirstLetters, isBlankAvatarPath } = require('call/callList/utils');
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
				return BX.message('MOBILEAPP_CALL_LIST_MISSED');
			}

			if (item.type === TYPE.INCOMING)
			{
				return timeStr
					? BX.message('MOBILEAPP_CALL_LIST_INCOMING_TIME').replace('#TIME#', timeStr)
					: BX.message('MOBILEAPP_CALL_LIST_INCOMING');
			}

			if (item.type === TYPE.OUTGOING)
			{
				return timeStr
					? BX.message('MOBILEAPP_CALL_LIST_OUTGOING_TIME').replace('#TIME#', timeStr)
					: BX.message('MOBILEAPP_CALL_LIST_OUTGOING');
			}

			return BX.message('MOBILEAPP_CALL_LIST_OUTGOING');
		}

		getCallIcon(item)
		{
			let iconName = ICONS.outgoing;

			if (
				item.status === STATUS.MISSED
				|| (item.type === TYPE.INCOMING && item.status === STATUS.DECLINED)
			)
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
				Text4({
					text: this.getSubtitleText(item),
					style: {
						color: Color.base4.toHex(),
					},
				}),
			);

			return View(
				{
					style: {
						paddingTop: 8,
						paddingLeft: 18,
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
						style: {
							flexDirection: 'row',
							paddingRight: 18,
							paddingBottom: 13.5,
						},
					},
					this.renderAvatar(),
					View(
						{
							style: {
								flex: 1,
							},
						},
						Text3({
							text: item.phoneNumber || item.title,
							numberOfLines: 2,
							ellipsize: 'end',
							style: { color: titleColor, fontWeight: '500', marginBottom: 4 },
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
						Text5({
							text: timeLabel,
							style: {
								color: Color.base3.toHex(),
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
									size: BadgeCounterSize.M,
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
						},
					},
					View({
						style: {
							width: 60,
							height: 0.5,
						},
					}),
					View({
						style: {
							flex: 1,
							height: 0.5,
							backgroundColor: Color.base5.toHex(),
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
			const isBlankAvatar = isBlankAvatarPath(avatarRel);

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
				Text1({
					text: getFirstLetters(item.title),
					style: {
						color: Color.baseWhiteFixed.toHex(),
						fontWeight: '500',
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
