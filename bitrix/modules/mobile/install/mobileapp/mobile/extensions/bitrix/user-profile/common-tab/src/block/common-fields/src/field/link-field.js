/**
 * @module user-profile/common-tab/src/block/common-fields/src/field/link-field
 */
jn.define('user-profile/common-tab/src/block/common-fields/src/field/link-field', (require, exports, module) => {
	const { BaseField } = require('user-profile/common-tab/src/block/common-fields/src/field/base-field');
	const { Link4 } = require('ui-system/blocks/link');
	const { TextField } = require('ui-system/typography/text-field');
	const { prepareLink } = require('utils/url');

	class LinkField extends BaseField
	{
		renderViewModeFieldValue(value, idx)
		{
			return Link4({
				key: `link-value-${idx}`,
				text: value,
				style: { marginBottom: 4 },
				onClick: async () => {
					PageManager.openPage({
						url: prepareLink(value),
						cache: false,
					});
				},
			});
		}

		renderEditModeFieldValue(value, idx)
		{
			const { id } = this.props;

			return TextField({
				ref: (ref) => this.bindRef(ref, idx),
				testId: this.getTestId(`${id.toLowerCase()}-input-${idx}`),
				value,
				size: 4,
				onChangeText: (newValue) => {
					this.onChange(newValue, idx);
				},
				style: {
					width: '100%',
				},
				onFocus: () => this.onFocus(idx),
			});
		}

		prepareValueForSave(value)
		{
			return prepareLink(value);
		}

		getDefaultValue()
		{
			return '';
		}
	}

	module.exports = { LinkField };
});
