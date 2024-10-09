/**
 * @module ui-system/form/inputs/datetime
 */
jn.define('ui-system/form/inputs/datetime', (require, exports, module) => {
	const { PropTypes } = require('utils/validation');
	const { DateTimeFieldClass, DatePickerType } = require('layout/ui/fields/datetime');
	const { InputClass, InputSize, InputMode, InputDesign, Icon } = require('ui-system/form/inputs/input');

	/**
	 * @typedef {InputProps} DateTimeInputProps
	 * @property {boolean} [enableTime]
	 * @property {boolean} [checkTimezoneOffset]
	 * @property {'date' | 'datetime'} [datePickerType]
	 * @property {string} [dateFormat]
	 * @property {string} [defaultListTitle]
	 * @property {Function} [dateFormatter]
	 * @property {Array} [items]
	 * @property {Function} [copyingOnLongClick]
	 *
	 * @class DateTimeInputTheme
	 */
	class DateTimeInputTheme extends InputClass
	{
		handleOnContentClick()
		{
			const contentClick = this.field.getContentClickHandler();

			if (contentClick)
			{
				contentClick();
			}
		}

		handleOnContentLongClick()
		{
			const longClick = this.field.getContentLongClickHandler();

			if (longClick)
			{
				longClick();
			}
		}

		getValue()
		{
			return this.field.getDisplayedValue();
		}

		getPlaceholder()
		{
			const placeholder = super.getPlaceholder();
			const defaultPlaceholder = this.field.getEmptyText();
			const placeholderEmptyText = placeholder || defaultPlaceholder;

			if (placeholderEmptyText && !this.isDisabled())
			{
				return placeholderEmptyText;
			}

			return '';
		}

		isReadOnly()
		{
			return true;
		}
	}

	/**
	 * @param {DateTimeInputProps} props
	 * @returns {DateTimeInputTheme}
	 */
	const DateTimeInput = (props) => {
		const {
			enableTime,
			parentWidget,
			datePickerType,
			dateFormat,
			dateFormatter,
			defaultListTitle,
			checkTimezoneOffset,
			copyingOnLongClick,
			...restProps
		} = props;

		const field = new DateTimeFieldClass({
			config: {
				dateFormat,
				enableTime,
				datePickerType,
				parentWidget,
				dateFormatter,
				defaultListTitle,
				checkTimezoneOffset,
				copyingOnLongClick,
			},
			...restProps,
		});

		return new DateTimeInputTheme({
			field,
			...restProps,
		});
	};

	DateTimeInputTheme.defaultProps = {
		...InputClass.defaultProps,
	};

	DateTimeInputTheme.propTypes = {
		...InputClass.propTypes,
		value: PropTypes.number,
		copyingOnLongClick: PropTypes.bool,
		// datetime field props
		enableTime: PropTypes.bool,
		checkTimezoneOffset: PropTypes.bool,
		datePickerType: PropTypes.oneOf(Object.values(DatePickerType)),
		dateFormat: PropTypes.string,
		defaultListTitle: PropTypes.string,
		dateFormatter: PropTypes.func,
		items: PropTypes.array,
		onChange: PropTypes.func,
	};

	module.exports = {
		DateTimeInput,
		InputSize,
		InputMode,
		InputDesign,
		DatePickerType,
		Icon,
	};
});
