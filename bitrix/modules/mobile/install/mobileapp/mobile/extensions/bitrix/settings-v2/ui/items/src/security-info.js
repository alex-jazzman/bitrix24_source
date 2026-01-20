/**
 * @module settings-v2/ui/items/src/security-info
 */

jn.define('settings-v2/ui/items/src/security-info', (require, exports, module) => {
	const { SettingSelector, SettingMode } = require('ui-system/blocks/setting-selector');
	const { createTestIdGenerator } = require('utils/test');
	const { Color } = require('tokens');
	const { Loc } = require('loc');

	class SecurityInfoItem extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				testId: 'security-button-item',
				context: this,
			});

			this.state = {
				isOn: props.value,
			};
		}

		getTextProps()
		{
			if (this.state.isOn)
			{
				return {
					text: Loc.getMessage('SETTINGS_V2_STRUCTURE_UI_ITEMS_SECURITY_INFO_IS_ON'),
					color: Color.accentMainLink,
				};
			}

			if (env.isAdmin || !this.props.isOtpMandatory)
			{
				return {
					text: Loc.getMessage('SETTINGS_V2_STRUCTURE_UI_ITEMS_SECURITY_INFO_IS_OFF'),
					color: Color.base4,
				};
			}

			return {
				text: Loc.getMessage('SETTINGS_V2_STRUCTURE_UI_ITEMS_SECURITY_INFO_IS_OFF_AND_MANDATORY'),
				color: Color.accentMainAlert,
			};
		}

		render()
		{
			const { id } = this.props;

			return SettingSelector({
				...this.props,
				testId: this.getTestId(id),
				mode: SettingMode.PARAMETER,
				modeParams: {
					chevron: true,
					...this.getTextProps(),
				},
			});
		}
	}

	module.exports = {
		SecurityInfoItem,
	};
});
