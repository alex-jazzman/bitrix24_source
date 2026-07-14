/**
 * @module call/callList/searchUserItem
 */
jn.define('call/callList/searchUserItem', (require, exports, module) => {
	const { Color } = require('tokens');

	class SearchUserItemComponent extends LayoutComponent
	{
		render()
		{
			const { item, onClick } = this.props;
			const title = String(item.title || '');
			const position = String(item.workPosition || '').trim();
			const subtitle = position || BX.message('MOBILEAPP_CALL_LIST_DEFAULT_POSITION');
			const avatarBg = item.userColor;

			return View(
				{
					style: {
						paddingTop: 8,
						paddingBottom: 1,
						paddingHorizontal: 18,
						position: 'relative',
					},
					onClick: () => {
						if (typeof onClick === 'function')
						{
							onClick();
						}
					},
				},
				View(
					{ style: { flexDirection: 'row' } },
					this.renderAvatar(item, avatarBg),
					View(
						{ style: { flex: 1 } },
						Text({
							text: title,
							style: {
								color: Color.base1.toHex(),
								fontSize: 16,
								fontWeight: '600',
								marginBottom: 4,
							},
						}),
						Text({
							text: subtitle,
							style: {
								color: Color.base4.toHex(),
								fontSize: 15,
							},
						}),
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
						style: {
							width: 62,
							height: 1,
						},
					}),
					View({
						style: {
							flex: 1,
							height: 1,
							backgroundColor: Color.bgSeparatorSecondary.toHex(),
						},
					}),
				),
			);
		}

		renderAvatar(item, avatarBg)
		{
			const avatarPath = String(item.avatar || '');
			const avatarStyle = {
				width: 56,
				height: 56,
				borderRadius: 100,
				marginRight: 10,
				backgroundColor: avatarBg,
				justifyContent: 'center',
				alignItems: 'center',
			};

			const finalUri = this.getAvatarUri(avatarPath);
			if (finalUri)
			{
				return Image({
					style: avatarStyle,
					uri: finalUri,
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
						fontSize: 20,
					},
				}),
			);
		}

		getAvatarUri(avatarPath)
		{
			if (!avatarPath)
			{
				return '';
			}

			if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://'))
			{
				return avatarPath;
			}

			return `${currentDomain}${avatarPath}`;
		}
	}

	function SearchUserItem(props)
	{
		return new SearchUserItemComponent(props);
	}

	module.exports = { SearchUserItem };
});
