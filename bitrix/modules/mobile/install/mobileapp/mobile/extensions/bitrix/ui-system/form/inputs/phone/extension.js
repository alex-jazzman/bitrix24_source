/**
 * @module ui-system/form/inputs/phone
 */
jn.define('ui-system/form/inputs/phone', (require, exports, module) => {
	const {
		getCountryCode,
		showCountryPicker,
		getFlagImageByCountryCode,
		getGlobalCountryCode,
	} = require('utils/phone');
	const { Corner, Indent } = require('tokens');
	const { phoneUtils } = require('native/phonenumber');
	const { PropTypes } = require('utils/validation');
	const { PhoneNumberField } = require('ui-system/typography/phone-field');
	const { InputClass, InputSize, InputMode, InputDesign, Icon } = require('ui-system/form/inputs/input');

	let changedNumber = false;

	/**
	 * @typedef {InputProps} PhoneInputProps
	 * @property {boolean} [showDefaultCountryPhoneCode]
	 * @property {boolean} [showCountryFlag]
	 * @property {string} [countryCode]
	 *
	 * @class EmailInputTheme
	 */
	class PhoneInput extends InputClass
	{
		componentWillUnmount()
		{
			super.componentWillUnmount();

			changedNumber = false;
		}

		initProperties()
		{
			super.initProperties();

			this.globalCountryCode = getGlobalCountryCode();
		}

		getStateObject(props)
		{
			const state = super.getStateObject(props);

			if (!changedNumber)
			{
				state.countryCode = this.getCountryCode(props.countryCode);
			}

			return state;
		}

		renderContent()
		{
			return PhoneNumberField(this.getFieldProps());
		}

		getFieldProps()
		{
			return {
				...super.getFieldProps(),
				value: this.getValuePhoneNumber(),
				onChangeText: this.handleOnChangeText,
				keyboardType: 'phone-pad',
			};
		}

		getValuePhoneNumber()
		{
			const phoneNumber = this.getValue();
			const { countryCode } = this.state;

			if (this.isShowDefaultCountryPhoneCode() && !phoneNumber && countryCode !== this.globalCountryCode)
			{
				return `+${this.getPhoneCode()}`;
			}

			return phoneNumber;
		}

		async handleOnClickLeftContent()
		{
			if (!this.isEnable())
			{
				return;
			}

			super.handleOnClickLeftContent();

			const { phoneNumber } = await showCountryPicker({ phoneNumber: this.getValue() });

			this.handleOnChange(phoneNumber);
		}

		handleOnChangeText(value)
		{
			changedNumber = true;

			if (!this.isShowCountryFlag())
			{
				super.handleOnChangeText(value);

				return;
			}

			const { countryCode: prevCountryCode } = this.state;
			const countryCode = value && value !== '+'
				? getCountryCode(value, this.getInitCountryCode())
				: this.globalCountryCode;

			if (countryCode === prevCountryCode)
			{
				super.handleOnChangeText(value);
			}
			else
			{
				this.setState(
					{ countryCode },
					() => {
						super.handleOnChange(value);
					},
				);
			}
		}

		renderLeftContent()
		{
			if (!this.isShowCountryFlag())
			{
				return null;
			}

			return super.renderLeftContent();
		}

		getLeftContent()
		{
			if (!this.shouldRenderCountryFlag())
			{
				return Icon.EARTH;
			}

			const uri = getFlagImageByCountryCode(this.getCurrentCountryCode());

			return Image({
				uri,
				resizeMode: 'contain',
				named: Icon.EARTH.getIconName(),
				style: {
					...this.getFlagSize(),
					marginRight: Indent.XS.toNumber(),
					borderRadius: Corner.XS.toNumber(),
				},
				onFailure: () => {
					this.setState({
						countryCode: this.globalCountryCode,
					});
				},
			});
		}

		getPhoneCode()
		{
			const countryCode = this.getInitCountryCode();

			return phoneUtils.getPhoneCode(this.getCountryCode(countryCode));
		}

		getCurrentCountryCode()
		{
			const { countryCode } = this.state;

			return countryCode;
		}

		getCountryCode(countryCode)
		{
			const phoneNumber = this.getValue();

			return getCountryCode(phoneNumber, countryCode);
		}

		getInitCountryCode()
		{
			const { countryCode } = this.props;

			return countryCode;
		}

		isShowDefaultCountryPhoneCode()
		{
			const { showDefaultCountryPhoneCode } = this.props;

			return Boolean(showDefaultCountryPhoneCode);
		}

		isShowCountryFlag()
		{
			const { showCountryFlag } = this.props;

			return Boolean(showCountryFlag);
		}

		shouldRenderCountryFlag()
		{
			return this.getCurrentCountryCode() !== this.globalCountryCode;
		}

		getFlagSize()
		{
			return {
				width: 22,
				height: 17,
			};
		}
	}

	PhoneInput.defaultProps = {
		showCountryFlag: true,
		showDefaultCountryPhoneCode: true,
		...InputClass.defaultProps,
	};

	PhoneInput.propTypes = {
		...InputClass.propTypes,
		showDefaultCountryPhoneCode: PropTypes.bool,
		showCountryFlag: PropTypes.bool,
		countryCode: PropTypes.string,
	};

	module.exports = {
		/**
		 * @param {PhoneInputProps} props
		 * @returns {PhoneInput}
		 */
		PhoneInput: (props) => new PhoneInput(props),
		InputSize,
		InputMode,
		InputDesign,
		Icon,
	};
});
