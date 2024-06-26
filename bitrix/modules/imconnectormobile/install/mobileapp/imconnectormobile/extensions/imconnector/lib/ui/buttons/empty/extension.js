/**
 * @module imconnector/lib/ui/buttons/empty
 */
jn.define('imconnector/lib/ui/buttons/empty', (require, exports, module) => {
	const AppTheme = require('apptheme');
	const { Type } = require('type');
	const { withPressed } = require('utils/color');

	/**
	 * @param {EmptyButtonProps} props
	 * @return {*}
	 * @constructor
	 */
	function EmptyButton(props)
	{
		const borderRadius = BX.prop.getNumber(props.style, 'borderRadius', 20);
		const width = BX.prop.getNumber(props.style, 'width', null);
		const height = BX.prop.getNumber(props.style, 'height', null);

		return View(
			{
				style: {
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'center',
					backgroundColor: withPressed(AppTheme.colors.base8),
					borderColor: AppTheme.colors.base3,
					borderWidth: 1,
					borderRadius,
					paddingVertical: 4,
					paddingHorizontal: 25,
					width,
					height,
				},
				clickable: true,
				onClick: () => {
					if (Type.isFunction(props.onClick))
					{
						props.onClick();
					}
				},

			},
			Text({
				style: {
					color: AppTheme.colors.base1,
					fontSize: 16,
					fontWeight: 400,
					numberOfLines: 1,
				},
				text: props.text,
			}),
		);
	}

	module.exports = { EmptyButton };
});
