/**
 * @module communication/connection/item
 */
jn.define('communication/connection/item', (require, exports, module) => {

	const { ConnectionSvg } = require('assets/communication/connection');

	const ICON_COLOR = {
		ENABLED: '#E6F6FD',
		DISABLED: '#F6F7F7',
	};

	const connectionItem = ({ enabled, type, horizontal, connectionMenu }) => {

		const typeStyles = styles[type] || {};

		const svgContent = ConnectionSvg[type];
		const iconColor = enabled
			? ICON_COLOR.ENABLED
			: ICON_COLOR.DISABLED;

		return View(
			{
				style: {
					padding: 12,
					backgroundColor: enabled && iconColor,
					borderRadius: 20,
					alignItems: 'center',
					justifyContent: 'center',
					width: horizontal ? 36 : 42,
					height: horizontal ? 36 : 42,
					marginBottom: horizontal ? 0 : 13,
				},
				onClick: () => {
					if (enabled && connectionMenu)
					{
						connectionMenu.show([type]);
					}
				},
			},
			Image({
				style: {
					width: typeStyles.width - 3,
					height: typeStyles.height - 3,
				},
				svg: {
					content: svgContent(enabled),
				},
			}),
		);
	};

	const styles = {
		phone: {
			width: 21,
			height: 21,
		},
		im: {
			width: 20,
			height: 18,
		},
		email: {
			width: 21,
			height: 15,
		},
	};

	module.exports = { connectionItem };
});