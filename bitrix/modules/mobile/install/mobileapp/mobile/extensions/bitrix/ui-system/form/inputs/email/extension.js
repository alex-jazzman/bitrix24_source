/**
 * @module ui-system/form/inputs/email
 */
jn.define('ui-system/form/inputs/email', (require, exports, module) => {
	const { EmailFieldClass } = require('layout/ui/fields/email');
	const { PropTypes } = require('utils/validation');
	const { getDomainImageUri, getEmailServiceName, defaultImageName, isValidEmail } = require('utils/email');
	const { InputClass, InputSize, InputMode, InputDesign, Icon } = require('ui-system/form/inputs/input');
	const { InputDomainIconPlace } = require('ui-system/form/inputs/email/src/domain-icon-place-enum');

	/**
	 * @class EmailInputTheme
	 * @param {...InputProps} props
	 * @param {boolean} [props.validation]
	 * @param {InputDomainIconPlace} [props.domainIconPlace]
	 * @param {function} [props.onChange]
	 */
	class EmailInputClass extends InputClass
	{
		getValidationErrorMessage()
		{
			return EmailFieldClass.getValidationErrorMessage();
		}

		getLeftContent()
		{
			const { domainIconPlace } = this.props;

			return domainIconPlace?.isLeft()
				? this.getContent(super.getLeftContent())
				: super.getLeftContent();
		}

		getRightContent()
		{
			const { domainIconPlace } = this.props;

			return domainIconPlace?.isRight()
				? this.getContent(super.getRightContent())
				: super.getRightContent();
		}

		rightStickContent()
		{
			const { domainIconPlace } = this.props;

			return domainIconPlace?.isRightStick()
				? this.getContent(super.getRightStickContent())
				: super.getRightStickContent();
		}

		getContent(content)
		{
			if (!content)
			{
				return null;
			}

			const { domainIconPlace } = this.props;

			if (!domainIconPlace)
			{
				return content;
			}

			const service = getEmailServiceName(this.getValue());

			if (service === defaultImageName)
			{
				return content;
			}

			return this.renderDomainIcon(service);
		}

		renderDomainIcon(service)
		{
			const size = this.getIconSize();

			return Image({
				style: {
					width: size,
					height: size,
				},
				uri: getDomainImageUri({ service }),
				resizeMode: 'contain',
			});
		}

		isValid()
		{
			const { validation } = this.props;

			if (validation)
			{
				return isValidEmail(this.getValue()) && super.isValid();
			}

			return super.isValid();
		}
	}

	EmailInputClass.defaultProps = {
		...InputClass.defaultProps,
		validation: false,
	};

	EmailInputClass.propTypes = {
		...InputClass.propTypes,
		validation: PropTypes.bool,
		domainIconPlace: PropTypes.instanceOf(InputDomainIconPlace),
		onChange: PropTypes.func,
	};

	module.exports = {
		EmailInput: (props) => new EmailInputClass(props),
		InputSize,
		InputMode,
		InputDesign,
		InputDomainIconPlace,
		Icon,
	};
});
