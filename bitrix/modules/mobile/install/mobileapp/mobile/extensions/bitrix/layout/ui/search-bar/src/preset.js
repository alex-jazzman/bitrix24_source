/**
 * @module layout/ui/search-bar/preset
 */
jn.define('layout/ui/search-bar/preset', (require, exports, module) => {
	const { Color } = require('tokens');
	const { BaseItem } = require('layout/ui/search-bar/base-item');

	const PresetType = {
		BUTTON: 'button',
		TOGGLE: 'toggle',
	};

	/**
	 * @class Preset
	 * @typedef {LayoutComponent<SearchBarPresetProps, {}>}
	 */
	class Preset extends BaseItem
	{
		constructor(props)
		{
			super(props);

			this.preset = {
				id: props.id,
				name: props.name,
				type: props.type ?? PresetType.TOGGLE,
			};
		}

		shouldIgnoreClick()
		{
			if (this.preset.type === PresetType.BUTTON)
			{
				return false;
			}

			return this.props.active && this.props.isActivePresetRequired;
		}

		handleClick()
		{
			if (this.preset.type === PresetType.BUTTON)
			{
				this.props.onButtonClick?.();

				return;
			}

			super.handleClick();
		}

		getSearchButtonBackgroundColor()
		{
			return (this.isDefault() ? null : Color.accentMainPrimary.toHex());
		}

		getOnClickParams()
		{
			const params = super.getOnClickParams();
			params.preset = this.preset;
			params.presetId = this.preset.id;

			return params;
		}
	}

	module.exports = { Preset, PresetType };
});
