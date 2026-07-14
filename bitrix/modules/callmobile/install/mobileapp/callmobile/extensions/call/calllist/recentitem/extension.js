/**
 * @module call/callList/recentItem
 */
jn.define('call/callList/recentItem', (require, exports, module) => {
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
						flexDirection: 'row',
						paddingLeft: 18,
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
							paddingVertical: 15,
							marginLeft: 12,
							paddingRight: 10,
							borderBottomWidth: withSeparator ? 1 : 0,
							borderBottomColor: withSeparator ? Color.bgSeparatorPrimary.toHex() : null,
						},
					},
					Text({
						text: item.title,
						style: {
							color: Color.base1.toHex(),
							fontSize: 18,
						},
					}),
					Text({
						text: item.workPosition,
						style: {
							color: Color.base3.toHex(),
							fontSize: 15,
							marginTop: 2,
						},
					}),
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

			if (avatarPath)
			{
				return Image({
					style: avatarStyle,
					uri: avatarPath,
					resizeMode: 'cover',
				});
			}

			return View(
				{ style: avatarStyle },
				Text({
					text: String(item.title || '').slice(0, 2).toUpperCase(),
					style: {
						color: Color.baseWhiteFixed.toHex(),
						fontWeight: '600',
						fontSize: 16,
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
