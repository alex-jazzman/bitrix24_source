/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/active-indicator
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/navigation/buttons/active-indicator', (require, exports, module) => {
	const { Color } = require('tokens');

	/**
	 * @param {object} props
	 * @param {boolean} props.isActive
	 * @param {Partial<ElementStyle>} [props.style]
	 * @return {BaseMethods}
	 * @constructor
	 */
	function ActiveIndicator(props)
	{
		return View(
			{
				style: {
					flex: 1,
				},
			},
			View({
				style: {
					backgroundColor: props.isActive ? Color.accentMainPrimaryalt.toHex() : Color.bgSecondary.toHex(),
					width: 22,
					height: 3,
					borderTopRightRadius: 4,
					borderTopLeftRadius: 4,
				},
			}),
		);
	}

	module.exports = { ActiveIndicator };
});
