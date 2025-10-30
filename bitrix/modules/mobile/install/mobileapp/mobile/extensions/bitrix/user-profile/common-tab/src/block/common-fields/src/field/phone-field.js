/**
 * @module user-profile/common-tab/src/block/common-fields/src/field/phone-field
 */
jn.define('user-profile/common-tab/src/block/common-fields/src/field/phone-field', (require, exports, module) => {
	const { BaseField } = require('user-profile/common-tab/src/block/common-fields/src/field/base-field');
	const { isPhoneNumber, getFormattedNumber } = require('utils/phone');
	const { Text4 } = require('ui-system/typography/text');
	const { Link4 } = require('ui-system/blocks/link');
	const { Color, Indent } = require('tokens');
	const {
		InputSize,
		InputDesign,
		InputMode,
		PhoneInput,
	} = require('ui-system/form/inputs/phone');

	class PhoneField extends BaseField
	{
		renderViewModeFieldValue(value, idx)
		{
			const { id } = this.props;

			if (isPhoneNumber)
			{
				return Link4({
					testId: this.getTestId(`phone-${id.toLowerCase()}-${idx}`),
					text: getFormattedNumber(value),
					numberOfLines: 1,
					onClick: () => {
						const callTo = `tel:${value}`;
						Application.openUrl(callTo);
					},
				});
			}

			return Text4({
				text: value,
				color: Color.base1,
			});
		}

		renderEditModeFieldValue(value, idx)
		{
			const { id } = this.props;

			return PhoneInput({
				forwardRef: (ref) => this.bindRef(ref, idx),
				testId: this.getTestId(`phone-input-${id.toLowerCase()}-${idx}`),
				value,
				size: InputSize.M,
				design: InputDesign.GREY,
				mode: InputMode.NAKED,
				onChange: this.#onPhoneChange,
				onFocus: () => this.onFocus(idx),
			});
		}

		#onPhoneChange = (newValue) => {
			const { onChange } = this.props;
			this.setState({ value: newValue }, () => {
				onChange?.(newValue);
			});
		};

		getFieldContainerStyle()
		{
			const { isEditMode, isFirst } = this.props;

			return {
				marginTop: isFirst ? 0 : Indent.XL2.toNumber(),
				alignItems: 'flex-start',
				borderBottomColor: Color.bgSeparatorSecondary.toHex(),
				borderBottomWidth: isEditMode ? 1 : 0,
			};
		}

		getFieldTitleStyle()
		{
			return {};
		}
	}

	module.exports = { PhoneField };
});
