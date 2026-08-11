/**
 * @module call/callList/empty
 */
jn.define('call/callList/emptyView', (require, exports, module) => {
	const { Text3 } = require('ui-system/typography/text');
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
						paddingTop: IS_IOS_PLATFORM ? '20%' : 80,
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
				Text3({
					text: text.title,
					style: {
						marginTop: 14,
						fontWeight: text.description ? '500' : 'normal',
						color: Color.base2.toHex(),
					},
				}),
				text.description && Text3({
					text: text.description,
					style: {
						marginTop: 8,
						color: Color.base3.toHex(),
						textAlign: 'center',
						maxWidth: 300,
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
