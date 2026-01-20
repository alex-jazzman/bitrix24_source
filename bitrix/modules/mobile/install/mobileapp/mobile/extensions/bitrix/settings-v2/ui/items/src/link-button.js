/**
 * @module settings-v2/ui/items/src/link-button
 */
jn.define('settings-v2/ui/items/src/link-button', (require, exports, module) => {
	const { SettingSelector, SettingMode } = require('ui-system/blocks/setting-selector');
	const { Color } = require('tokens');
	const { createTestIdGenerator } = require('utils/test');

	class LinkButtonItem extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'settings-link-button-item',
				context: this,
			});
		}

		render()
		{
			const { id, icon } = this.props;

			return SettingSelector({
				...this.props,
				testId: this.getTestId(id),
				mode: SettingMode.RIGHT_ICON,
				icon: null,
				modeParams: {
					icon,
					iconColor: Color.base4,
				},
			});
		}
	}

	module.exports = {
		LinkButtonItem,
	};
});
