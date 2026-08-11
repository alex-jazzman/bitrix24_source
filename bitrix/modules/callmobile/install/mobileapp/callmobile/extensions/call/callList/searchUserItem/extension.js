/**
 * @module call/callList/searchUserItem
 */
jn.define('call/callList/searchUserItem', (require, exports, module) => {
	const { Text1, Text3, Text4 } = require('ui-system/typography/text');
	const { getFirstLetters, isBlankAvatarPath } = require('call/callList/utils');
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
						paddingLeft: 18,
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
					{
						style: {
							flexDirection: 'row',
							paddingRight: 18,
							paddingBottom: 13.5,
						},
					},
					this.renderAvatar(item, avatarBg),
					View(
						{ style: { flex: 1 } },
						Text3({
							text: title,
							style: {
								color: Color.base1.toHex(),
								fontWeight: '500',
								marginBottom: 4,
							},
						}),
						Text4({
							text: subtitle,
							style: {
								color: Color.base4.toHex(),
							},
						}),
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
							backgroundColor: Color.base4.toHex(),
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
				Text1({
					text: getFirstLetters(item.title),
					style: {
						color: Color.baseWhiteFixed.toHex(),
						fontWeight: '400',
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

			if (isBlankAvatarPath(avatarPath))
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
