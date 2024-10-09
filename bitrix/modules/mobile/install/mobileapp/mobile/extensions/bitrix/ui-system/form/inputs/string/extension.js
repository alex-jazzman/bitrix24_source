/**
 * @module ui-system/form/inputs/string
 */
jn.define('ui-system/form/inputs/string', (require, exports, module) => {
	const { TextField } = require('ui-system/typography/text-field');
	const { InputClass, InputSize, InputMode, InputDesign } = require('ui-system/form/inputs/input');

	/**
	 * @typedef {InputProps} StringInputProps
	 * @property {boolean} [isPassword]
	 * @property {'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad'} [keyboardType='default']
	 * @property {'characters' | 'words' | 'sentences' | 'none'} [autoCapitalize='none']
	 * @property {boolean} [enableKeyboardHide]
	 * @property {Function} [onFocus]
	 * @property {Function} [onBlur]
	 * @property {Function} [onSelectionChange]
	 *
	 * @class StringInput
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
		/**
		 * @param {StringInputProps} props
		 * @returns {StringInput}
		 */
		StringInput: (props) => new StringInput(props),
		InputSize,
		InputMode,
		InputDesign,
	};
});
