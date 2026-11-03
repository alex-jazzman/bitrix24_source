/**
 * @module tab-presets/managed/editors/src/preset-managed/managed-preset-config-error
 */
jn.define('tab-presets/managed/editors/src/preset-managed/managed-preset-config-error', (require, exports, module) => {
	const { Text7 } = require('ui-system/typography/text');
	const { Color, Indent, Component } = require('tokens');

	/**
	 * @param {ManagedPresetConfigErrorProps} props
	 */
	const ManagedPresetConfigError = (props) => {
		if (!props.error)
		{
			return null;
		}

		return View(
			{
				style: {
					paddingHorizontal: Component.areaPaddingLr.toNumber(),
					paddingTop: Indent.M.toNumber(),
				},
				testId: `${props.testId}-config-error`,
			},
			Text7({
				text: props.error,
				color: Color.accentMainAlert,
				testId: `${props.testId}-config-error-text`,
			}),
		);
	};

	module.exports = { ManagedPresetConfigError };
});
