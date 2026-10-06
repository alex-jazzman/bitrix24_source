/**
 * @module call/sync/heroBanner
 */
jn.define('call/sync/heroBanner', (require, exports, module) => {
	const { Color, Indent, Component, Typography } = require('tokens');

	const BANNER_HEIGHT = 148;
	const MASCOT_WIDTH = 106;

	// Teal glow along the bottom edge (linear gradient bottom to top, fading to transparent)
	const GLOW_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" preserveAspectRatio="none"><defs><linearGradient id="glow" x1="0" y1="100" x2="0" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#33e6d2" stop-opacity="0.45"/><stop offset="1" stop-color="#33e6d2" stop-opacity="0"/></linearGradient></defs><rect width="100" height="100" fill="url(#glow)"/></svg>';

	/**
	 * @param {{
	 *   testId: string,
	 *   imageUri: string,
	 *   backgroundImageUri: string,
	 *   title: string,
	 *   description: string,
	 *   onClick: () => void,
	 * }} props
	 */
	const HeroBanner = (props) =>
	{
		return View(
			{
				testId: props.testId,
				onClick: props.onClick,
				style: {
					position: 'relative',
					height: BANNER_HEIGHT,
					borderRadius: Component.cardCornerXL.toNumber(),
					backgroundColor: Color.accentMainPrimary.toHex(),
					backgroundImage: props.backgroundImageUri,
					backgroundResizeMode: 'stretch',
					overflow: 'hidden',
					flexDirection: 'row',
					alignItems: 'center',
				},
			},
			View({
				style: {
					position: 'absolute',
					left: 0,
					right: 0,
					bottom: 0,
					height: 80,
					backgroundImageSvg: GLOW_SVG,
					backgroundResizeMode: 'stretch',
				},
			}),
			Image({
				uri: props.imageUri,
				resizeMode: 'contain',
				style: {
					position: 'absolute',
					left: Indent.XL3.toNumber(),
					bottom: -20,
					width: MASCOT_WIDTH,
					height: 150,
				},
			}),
			View(
				{
					style: {
						marginLeft: Indent.XL3.toNumber() + MASCOT_WIDTH + Indent.XL.toNumber(),
						marginRight: Indent.XL3.toNumber(),
						flex: 1,
					},
				},
				Text({
					text: props.title,
					numberOfLines: 2,
					style: {
						...Typography.h3.getStyle(),
						color: Color.baseWhiteFixed.toHex(),
					},
				}),
				Text({
					text: props.description,
					numberOfLines: 2,
					style: {
						...Typography.text5.getStyle(),
						color: Color.baseWhiteFixed.toHex(),
					},
				}),
			),
		);
	};

	module.exports = { HeroBanner };
});
