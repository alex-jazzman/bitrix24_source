/**
 * @module call/callList/recentItem
 */
jn.define('call/callList/recentItem', (require, exports, module) => {
	const { Text3, Text4 } = require('ui-system/typography/text');
	const { getFirstLetters, isBlankAvatarPath } = require('call/callList/utils');
	const { Color } = require('tokens');
	const { withPressed } = require('utils/color');

	class RecentItemComponent extends LayoutComponent
	{
		render()
		{
			const { item, onClick, withSeparator = true } = this.props;

			return View(
				{
					style: {
						backgroundColor: withPressed(Color.bgContentPrimary.toHex()),
					},
					clickable: true,
					onClick: () => {
						if (onClick)
						{
							onClick();
						}
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
							paddingLeft: 18,
							paddingRight: 18,
						},
					},
					View(
						{
							style: {
								alignItems: 'center',
								justifyContent: 'center',
							},
						},
						this.renderAvatar(item, item.userColor),
					),
					View(
						{
							style: {
								flexDirection: 'column',
								justifyContent: 'center',
								flex: 1,
								paddingTop: 15,
								paddingBottom: 13.5,
								marginLeft: 12,
								paddingRight: 10,
							},
						},
						Text3({
							text: item.title,
							style: {
								color: Color.base1.toHex(),
								fontWeight: '500',
							},
						}),
						Text4({
							text: item.workPosition,
							style: {
								color: Color.base3.toHex(),
								marginTop: 2,
							},
						}),
					),
				),
				(withSeparator
					? View(
						{
							style: {
								flexDirection: 'row',
								alignItems: 'center',
								paddingLeft: 18,
							},
						},
						View({
							style: {
								width: 45,
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
					)
					: null
				),
			);
		}

		renderAvatar(item, avatarBg)
		{
			const avatarPath = String(item.avatar || '');
			const avatarStyle = {
				width: 40,
				height: 40,
				borderRadius: 100,
				backgroundColor: avatarBg,
				justifyContent: 'center',
				alignItems: 'center',
			};

			if (!isBlankAvatarPath(avatarPath))
			{
				return Image({
					style: avatarStyle,
					uri: avatarPath,
					resizeMode: 'cover',
				});
			}

			return View(
				{ style: avatarStyle },
				Text3({
					text: getFirstLetters(item.title),
					style: {
						color: Color.baseWhiteFixed.toHex(),
						fontWeight: '400',
					},
				}),
			);
		}
	}

	function RecentItem(props)
	{
		return new RecentItemComponent(props);
	}

	module.exports = { RecentItem };
});
