/**
 * @module layout/ui/fields/client/elements/action
 */
jn.define('layout/ui/fields/client/elements/action', (require, exports, module) => {
	const { AppTheme } = require('apptheme/extended');
	const { Color } = require('tokens');
	const { Icon, IconView } = require('ui-system/blocks/icon');

	const EDIT_ICON_SIZE = 21;

	/**
	 * @function ClientItemAction
	 */
	function ClientItemAction(props)
	{
		const { readOnly } = props;

		return View(
			{
				style: {
					width: readOnly ? 0 : 38,
					alignItems: 'flex-end',
				},
			},
			!readOnly && View(
				{
					style: {
						width: 28,
						height: 28,
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				IconView({
					testId: 'ClientFieldEdit_icon',
					icon: Icon.EDIT,
					size: EDIT_ICON_SIZE,
					color: Color.base3,
				}),
			),
		);
	}

	module.exports = { ClientItemAction };
});
