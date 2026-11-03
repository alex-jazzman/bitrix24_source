/**
 * @module layout/ui/buttons/add-button
 */
jn.define('layout/ui/buttons/add-button', (require, exports, module) => {
	const { plus, chevronRight } = require('assets/common');
	const { merge } = require('utils/object');
	const AppTheme = require('apptheme');
	const { IconView } = require('ui-system/blocks/icon');
	const color = AppTheme.colors.base4;

	// the registry glyph fills about two thirds of its box: the 20px image slot draws it too
	// small, 28 too large against the 15px label
	const REGISTRY_ICON_SIZE = 24;

	/**
	 * @function AddButton
	 */
	function AddButton(props)
	{
		const {
			icon,
			iconColor,
			iconSize = REGISTRY_ICON_SIZE,
			svg,
			text,
			showArrow = false,
			deepMergeStyles = {},
			onClick,
		} = props;
		const styles = merge({
			view: {
				flexDirection: 'row',
				justifyContent: 'flex-start',
				alignItems: 'flex-start',
				flexGrow: 1,
				height: 24,
			},
			image: {
				height: 20,
				width: 20,
			},
			arrowWrapper: {
				flex: 1,
				alignItems: 'flex-end',
			},
			arrow: {
				height: 24,
				width: 24,
			},
			text: {
				color,
				fontSize: 15,
				fontWeight: '400',
				marginLeft: 2,
			},
		}, deepMergeStyles);

		return View(
			{
				style: styles.view,
				onClick,
			},
			icon
				? IconView({
					icon,
					color: iconColor,
					size: iconSize,
				})
				// callers without a registry counterpart still pass their own svg
				: Image({
					style: styles.image,
					svg: {
						content: svg || plus(color),
					},
				}),
			Text({
				style: styles.text,
				numberOfLines: 1,
				ellipsize: 'end',
				text,
			}),
			showArrow && View(
				{
					style: styles.arrowWrapper,
				},
				Image({
					style: styles.arrow,
					svg: {
						content: chevronRight(),
					},
				}),
			),
		);
	}

	module.exports = { AddButton };
});
