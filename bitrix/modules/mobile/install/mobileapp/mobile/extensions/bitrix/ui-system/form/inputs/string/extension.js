/**
 * @module ui-system/form/inputs/string
 */
jn.define('ui-system/form/inputs/string', (require, exports, module) => {
	const { TextField } = require('ui-system/typography/text-field');
	const { InputClass, InputSize, InputMode, InputDesign } = require('ui-system/form/inputs/input');

	/**
	 * @class StringInput
	 * @param {...InputProps} props
	 * @param {boolean} [props.isPassword]
	 * @param {'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad'} [props.keyboardType='default']
	 * @param {'characters' | 'words' | 'sentences' | 'none'} [props.autoCapitalize='none']
	 * @param {boolean} [props.enableKeyboardHide]
	 * @param {Function} [props.onFocus]
	 * @param {Function} [props.onBlur]
	 * @param {Function} [props.onSelectionChange]
	 */
	class StringInput extends InputClass
	{
		constructor(props)
		{
			super(props);

			this.handleOnSelectionChange = this.handleOnSelectionChange.bind(this);
		}

		renderContent()
		{
			return TextField(this.getFieldProps());
		}

		getFieldProps()
		{
			const {
				isPassword = false,
				keyboardType = 'default',
				autoCapitalize = 'none',
				enableKeyboardHide = false,
			} = this.props;

			return {
				...super.getFieldProps(),
				ref: (ref) => {
					this.contentFieldRef = ref;
				},
				isPassword,
				keyboardType,
				autoCapitalize,
				enableKeyboardHide,
				forcedValue: this.getValue(),
				onSelectionChange: this.handleOnSelectionChange,
			};
		}

		handleOnSelectionChange(value)
		{
			const { onSelectionChange } = this.props;

			if (onSelectionChange)
			{
				onSelectionChange(value);
			}
		}
	}

	StringInput.defaultProps = InputClass.defaultProps;

	StringInput.propTypes = {
		...InputClass.propTypes,
		keyboardType: PropTypes.string,
		autoCapitalize: PropTypes.string,
		enableKeyboardHide: PropTypes.bool,
		isPassword: PropTypes.bool,
		onSelectionChange: PropTypes.func,
		onCursorPositionChange: PropTypes.func,
	};

	module.exports = {
		StringInput: (props) => new StringInput(props),
		InputSize,
		InputMode,
		InputDesign,
	};
});
