/**
 * @module call/sync/actionRow
 */
jn.define('call/sync/actionRow', (require, exports, module) => {
	const { Color, Indent, Component, Typography } = require('tokens');
	const { IconView, Icon } = require('ui-system/blocks/icon');

	/**
	 * @param {{
	 *   testId: string,
	 *   iconUri: string,
	 *   title: string,
	 *   description: string,
	 *   onClick: () => void,
	 * }} props
	 */
	const ActionRow = (props) =>
	{
		return View(
			{
				testId: props.testId,
				onClick: props.onClick,
				style: {
					backgroundColor: Color.bgContentPrimary.toHex(),
					borderWidth: 1,
					borderColor: Color.bgSeparatorPrimary.toHex(),
					borderRadius: Component.cardCornerL.toNumber(),
					padding: Indent.XL.toNumber(),
					overflow: 'hidden',
				},
			},
			View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
					},
				},
				Image({
					uri: props.iconUri,
					resizeMode: 'contain',
					style: {
						width: 40,
						height: 40,
						marginRight: Indent.XL.toNumber(),
					},
				}),
				View(
					{
						style: {
							flex: 1,
							marginRight: Indent.M.toNumber(),
						},
					},
					Text({
						text: props.title,
						numberOfLines: 2,
						style: {
							...Typography.text2Accent.getStyle(),
							color: Color.base1.toHex(),
						},
					}),
					Text({
						text: props.description,
						numberOfLines: 2,
						style: {
							...Typography.text6.getStyle(),
							color: Color.base4.toHex(),
						},
					}),
				),
				IconView({
					icon: Icon.CHEVRON_TO_THE_RIGHT,
					color: Color.base4,
					size: 22,
				}),
			),
		);
	};

	module.exports = { ActionRow };
});
