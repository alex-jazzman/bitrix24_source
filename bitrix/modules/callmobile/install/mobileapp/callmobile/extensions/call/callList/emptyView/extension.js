/**
 * @module call/callList/empty
 */
jn.define('call/callList/emptyView', (require, exports, module) => {
	const { Color } = require('tokens');
	const IS_IOS_PLATFORM = Application.getPlatform() === 'ios';

	class EmptyViewComponent extends LayoutComponent
	{
		render()
		{
			const { text } = this.props;
			const pathToImg = '/bitrix/mobileapp/callmobile/extensions/call/callList/emptyView/img/';
			const emptyImageUri = `${currentDomain}${pathToImg}empty-zephyr.png`;

			return View(
				{
					style: {
						flex: 1,
						justifyContent: 'flex-start',
						alignItems: 'center',
						paddingTop: '50%',
					},
				},
				Image({
					style: {
						width: 146,
						height: 136,
					},
					uri: emptyImageUri,
					resizeMode: 'contain',
				}),
				Text({
					text: text.title,
					style: {
						marginTop: 14,
						fontSize: 16,
						fontWeight: text.description ? '500' : 'normal',
						color: Color.base2.toHex(),
					},
				}),
				text.description && Text({
					text: text.description,
					style: {
						marginTop: 8,
						fontSize: 16,
						color: Color.base3.toHex(),
						textAlign: 'center',
						maxWidth: 300,
						lineHeight: 19,
					},
				}),
				IS_IOS_PLATFORM && View(
					{
						style: {
							height: 60,
						},
					},
				),
			);
		}
	}

	function EmptyView(props)
	{
		return new EmptyViewComponent(props);
	}

	module.exports = { EmptyView };
});
