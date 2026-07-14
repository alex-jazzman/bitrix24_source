/**
 * @module call/callList/fastCallButton
 */
jn.define('call/callList/fastCallButton', (require, exports, module) => {
	const { Color } = require('tokens');
	const { withPressed } = require('utils/color');

	class FastCallButtonComponent extends LayoutComponent
	{
		render()
		{
			const { icon, title, subtitle, onClick, style } = this.props;

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						backgroundColor: withPressed(Color.bgContentPrimary.toHex()),
						...style,
					},
					onClick,
				},
				icon && Image({
					style: {
						width: 50,
						height: 50,
						marginRight: 8,
					},
					uri: icon,
					resizeMode: 'contain',
				}),
				View(
					{
						style: {
							flex: 1,
						},
					},
					Text({
						text: title,
						style: {
							fontSize: 17,
							fontWeight: '400',
							color: Color.base1.toHex(),
							marginBottom: 2,
						},
					}),
					Text({
						text: subtitle,
						style: {
							fontSize: 13,
							color: Color.base3.toHex(),
							lineHeight: 16,
						},
					}),
				),
			);
		}
	}

	function FastCallButton(props)
	{
		return new FastCallButtonComponent(props);
	}

	module.exports = { FastCallButton };
});
