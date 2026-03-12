/**
 * @module intranet/reinvite
 */
jn.define('intranet/reinvite', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { Color, Indent, Component } = require('tokens');
	const { isPhoneNumber } = require('utils/phone');
	const { isValidEmail } = require('utils/email');
	const { PropTypes } = require('utils/validation');
	const { Icon } = require('ui-system/blocks/icon');
	const { Area } = require('ui-system/layout/area');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { ButtonSize, ButtonDesign, Button } = require('ui-system/form/buttons/button');
	const { InputSize, InputDesign, InputMode, PhoneInput } = require('ui-system/form/inputs/phone');
	const { EmailInput, InputDomainIconPlace } = require('ui-system/form/inputs/email');
	const { ChipButton, ChipButtonDesign, ChipButtonMode } = require('ui-system/blocks/chips/chip-button');
	const { BBCodeText } = require('ui-system/typography/bbcodetext');
	const { Avatar } = require('ui-system/blocks/avatar');

	const { getState } = require('statemanager/redux/store');
	const { usersSelector } = require('statemanager/redux/slices/users');

	const REINVITE_PHONE_TYPE = 'phone';
	const REINVITE_EMAIL_TYPE = 'email';

	/**
	 * @class Reinvite
	 */
	class Reinvite extends LayoutComponent
	{
		static getStartingLayoutHeight()
		{
			const titleHeight = 44;
			const areaPadding = Component.areaPaddingTFirst.toNumber();
			const chipHeight = 32 + Indent.XS.toNumber() + Indent.XL2.toNumber();
			const inputHeight = 42 + Indent.M.toNumber() + Indent.XL2.toNumber();
			const buttonHeight = 42 + 2 * Indent.XL2.toNumber();
			const descriptionHeight = 66 + Indent.M.toNumber();

			return (
				titleHeight
				+ areaPadding
				+ chipHeight
				+ inputHeight
				+ buttonHeight
				+ descriptionHeight
			);
		}

		constructor(props)
		{
			super(props);

			this.user = usersSelector.selectById(getState(), Number(this.props.userId)) ?? null;
			if (!this.user)
			{
				throw new Error('User not found');
			}

			this.state = {
				phone: this.user.personalMobile,
				email: this.user.email,
				inputError: null,
			};
		}

		render()
		{
			return Box(
				{
					safeArea: {
						bottom: true,
					},
					resizableByKeyboard: true,
					footer: this.#renderFooter(),
				},
				Area(
					{
						isFirst: true,
					},
					View(
						{
							style: {
								alignItems: 'center',
								paddingHorizontal: Indent.M.toNumber(),
							},
						},
						this.#renderUserChip(),
						this.#renderInput(),
						this.#renderDescription(),
					),
				),
			);
		}

		#renderFooter()
		{
			return BoxFooter(
				{
					keyboardButton: {
						testId: 'reinvite-keyboard-send-button',
						text: Loc.getMessage('M_INTRANET_REINVITE_SEND_BUTTON'),
						onClick: this.save,
					},
				},
				Button({
					testId: 'reinvite-send-button',
					text: Loc.getMessage('M_INTRANET_REINVITE_SEND_BUTTON'),
					design: ButtonDesign.FILLED,
					size: ButtonSize.L,
					stretched: true,
					disabled: this.state.inputError !== null,
					onClick: this.save,
				}),
			);
		}

		#renderUserChip()
		{
			return ChipButton({
				style: {
					marginTop: Indent.XS.toNumber(),
					marginBottom: Indent.XL2.toNumber(),
				},
				rounded: false,
				mode: ChipButtonMode.OUTLINE,
				design: ChipButtonDesign.GREY,
				avatar: Avatar({
					id: this.user.id,
					size: 20,
				}),
				text: this.user.fullName,
			});
		}

		#renderInput()
		{
			const { phone, email, inputError } = this.state;

			if (this.#isEmailInvite())
			{
				return EmailInput({
					value: email,
					style: {
						marginTop: Indent.M.toNumber(),
						marginBottom: Indent.XL2.toNumber(),
					},
					label: Loc.getMessage('M_INTRANET_EMAIL_INPUT_TITLE'),
					size: InputSize.L,
					design: InputDesign.GREY,
					mode: InputMode.STROKE,
					align: 'center',
					focus: true,
					error: inputError ?? null,
					errorText: inputError,
					domainIconPlace: InputDomainIconPlace.LEFT,
					leftContent: Icon.MAIL,
					onChange: this.onChangeEmail,
					forwardRef: this.handleInputRef,
					testId: 'reinvite-email-input',
				});
			}

			if (this.#isPhoneInvite())
			{
				return PhoneInput({
					value: phone,
					style: {
						marginTop: Indent.M.toNumber(),
						marginBottom: Indent.XL2.toNumber(),
					},
					label: Loc.getMessage('M_INTRANET_PHONE_INPUT_TITLE'),
					size: InputSize.L,
					design: InputDesign.GREY,
					mode: InputMode.STROKE,
					align: 'center',
					focus: true,
					error: inputError ?? null,
					errorText: inputError,
					onChange: this.onChangePhone,
					forwardRef: this.handleInputRef,
					testId: 'reinvite-phone-input',
				});
			}

			console.error('User must have either phone or email to reinvite');

			return null;
		}

		#renderDescription()
		{
			const articleCode = '25477392';
			const articleUrl = helpdesk.getArticleUrl(articleCode);
			const descriptionText = Loc.getMessage(
				this.#isEmailInvite()
					? 'M_INTRANET_REINVITE_DESCRIPTION_EMAIL_TEXT'
					: 'M_INTRANET_REINVITE_DESCRIPTION_PHONE_TEXT',
				{
					'#LINK_START#': `[URL=${articleUrl}]`,
					'#LINK_END#': '[/URL]',
				},
			);

			return View(
				{
					style: {
						paddingTop: Indent.M.toNumber(),
						paddingHorizontal: Indent.XL2.toNumber(),
					},
				},
				BBCodeText({
					style: {
						textAlign: 'center',
					},
					size: 4,
					color: Color.base2.toHex(),
					linksUnderline: false,
					value: descriptionText,
					onLinkClick: () => helpdesk.openHelpArticle(articleCode, 'helpdesk'),
				}),
			);
		}

		handleInputRef = (ref) => {
			this.inputRef = ref;
			this.inputRef?.focus();
		};

		onChangeEmail = (newEmail) => {
			this.setState({
				email: newEmail,
				inputError: (
					Type.isStringFilled(newEmail)
						? null
						: Loc.getMessage('M_INTRANET_REINVITE_EMAIL_INPUT_EMPTY_EMAIL')
				),
			});
		};

		onChangePhone = (newPhone) => {
			this.setState({
				phone: newPhone,
				inputError: (
					Type.isStringFilled(newPhone)
						? null
						: Loc.getMessage('M_INTRANET_REINVITE_PHONE_INPUT_EMPTY_NUMBER')
				),
			});
		};

		save = () => {
			const { phone, email, inputError } = this.state;

			if (inputError)
			{
				return;
			}

			if (phone && !isPhoneNumber(phone))
			{
				this.setState({
					inputError: Loc.getMessage('M_INTRANET_REINVITE_PHONE_INPUT_INCORRECT_NUMBER'),
				});

				return;
			}

			if (email && !isValidEmail(email))
			{
				this.setState({
					inputError: Loc.getMessage('M_INTRANET_REINVITE_EMAIL_INPUT_INCORRECT_EMAIL'),
				});

				return;
			}

			const newValue = phone ?? email;
			const valueType = phone ? REINVITE_PHONE_TYPE : REINVITE_EMAIL_TYPE;

			this.props.onSave?.(newValue, valueType);
			this.props.layoutWidget.close();
		};

		#isEmailInvite()
		{
			return Type.isStringFilled(this.user.email);
		}

		#isPhoneInvite()
		{
			return Type.isStringFilled(this.user.personalMobile);
		}
	}

	Reinvite.propTypes = {
		userId: PropTypes.number.isRequired,
		onSave: PropTypes.func.isRequired,
		layoutWidget: PropTypes.object.isRequired,
	};

	module.exports = { Reinvite };
});
