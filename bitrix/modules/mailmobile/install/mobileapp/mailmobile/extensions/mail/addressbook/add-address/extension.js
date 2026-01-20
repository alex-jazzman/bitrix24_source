/**
 * @module mail/addressbook/add-address
 */
jn.define('mail/addressbook/add-address', (require, exports, module) => {
	const { StringInput, InputDesign, InputMode, InputSize } = require('ui-system/form/inputs/string');
	const { EmailInput } = require('ui-system/form/inputs/email');
	const { PureComponent } = require('layout/pure-component');
	const { Loc } = require('loc');
	const { clone } = require('utils/object');
	const { stringify } = require('utils/string');
	const { useCallback } = require('utils/function');
	const { isValidEmail } = require('utils/email');
	const { Haptics } = require('haptics');
	const { AjaxMethod } = require('mail/const');
	const { NotifyManager } = require('notify-manager');
	const { stringToColor, getInitials } = require('mail/message/elements/avatar');

	const {
		ButtonSize,
		ButtonDesign,
		Button,
	} = require('ui-system/form/buttons/button');

	class AddAddress extends PureComponent
	{
		constructor(props)
		{
			super(props);

			const {
				onClose = () => {},
				onSuccess = (customData) => {},
				textFromSearch = '',
			} = props;

			this.textFromSearch = textFromSearch;
			this.onSuccess = onSuccess;
			this.onClose = onClose;
			this.layoutWidget = props.layoutWidget;
			this.fieldRefs = {};
			this.constants = {
				fields: {
					email: {
						ref: (ref) => this.fieldRefs.email = ref,
					},
					name: {
						ref: (ref) => this.fieldRefs.name = ref,
					},
				},
			};

			this.state = {
				fields: this.#getEmptyFieldsData(),
			};
		}

		#getEmptyFieldsData()
		{
			let emailValue = '';
			let nameValue = '';

			if (isValidEmail(this.textFromSearch))
			{
				emailValue = this.textFromSearch;
			}
			else
			{
				nameValue = this.textFromSearch;
			}

			return {
				email: {
					value: emailValue,
				},
				name: {
					value: nameValue,
				},
			};
		}

		#onChangeField(key, data)
		{
			const fields = clone(this.state.fields);
			fields[key].value = stringify(data);
			this.setState({ fields });
		}

		#getInvalidField()
		{
			const {
				email,
			} = this.state.fields;

			if (!isValidEmail(email.value))
			{
				const emailField = this.fieldRefs.email;

				if (emailField)
				{
					return emailField;
				}
			}

			return null;
		}

		render()
		{
			return View(
				{
					style: {
						paddingTop: 10,
						paddingLeft: 18,
						paddingRight: 18,
						flex: 1,
					},
				},
				StringInput({
					size: InputSize.L,
					design: InputDesign.GREY,
					mode: InputMode.STROKE,
					testId: 'mail-addressbook-add-address-name',
					ref: this.constants.fields.name.ref,
					showRequired: false,
					required: true,
					showTitle: false,
					value: this.state.fields.name.value,
					onChange: useCallback((data) => this.#onChangeField('name', data), ['name']),
					label: Loc.getMessage('MAIL_ADDRESS_BOOK_ADD_ADDRESS_NAME_LABEL'),
					placeholder: '',
				}),
				View(
					{
						style: {
							height: 20,
						},
					},
				),
				EmailInput({
					label: Loc.getMessage('MAIL_ADDRESS_BOOK_ADD_ADDRESS_EMAIL_LABEL'),
					size: InputSize.L,
					design: InputDesign.GREY,
					mode: InputMode.STROKE,
					showTitle: false,
					validation: true,
					testId: 'mail-addressbook-add-address-email',
					ref: this.constants.fields.email.ref,
					showLeftIcon: false,
					showRequired: false,
					required: true,
					value: this.state.fields.email.value,
					onChange: useCallback((data) => this.#onChangeField('email', data), ['email']),
					onValid: isValidEmail,
					placeholder: Loc.getMessage('MAIL_ADDRESS_BOOK_ADD_ADDRESS_EMAIL_PLACEHOLDER'),
				}),
				View(
					{
						style: {
							height: 40,
						},
					},
				),
				Button({
					testId: 'add-new-email-to-addressbook-button',
					text: Loc.getMessage('MAIL_ADDRESS_BOOK_ADD_ADDRESS_BUTTON'),
					size: ButtonSize.XL,
					design: ButtonDesign.FILLED,
					disabled: false,
					stretched: true,
					onClick: this.onAddAddress.bind(this),
				}),
			);
		}

		onAddAddress()
		{
			const invalidField = this.#getInvalidField();

			if (invalidField)
			{
				invalidField?.focus();
				Haptics.notifyWarning();

				return;
			}

			const {
				name,
				email,
			} = this.state.fields;

			const emailValue = email.value.trim();
			let nameValue = name.value.trim();

			if (emailValue === '')
			{
				this.onClose();
			}
			else
			{
				if (nameValue.length === 0)
				{
					nameValue = emailValue.split('@')[0];
				}

				NotifyManager.showLoadingIndicator();

				const contactData = {
					ID: 'new',
					EMAIL: emailValue,
					NAME: nameValue,
					COLOR: stringToColor(emailValue),
					INITIALS: getInitials(nameValue, emailValue),
				};

				BX.ajax.runAction(AjaxMethod.saveContactInAddressBook, {
					data: {
						contactData,
					},
				}).then(({ data }) => {
					if (Array.isArray(data) && data.length > 0)
					{
						const firstAddress = data[0];
						const { customData } = firstAddress;
						NotifyManager.hideLoadingIndicatorWithoutFallback();
						this.onSuccess(customData);
					}
				}).catch(({ errors }) => {
					NotifyManager.hideLoadingIndicatorWithoutFallback();
					this.onClose();
				});
			}
		}

		/**
		 * @function show
		 *
		 * @param props
		 */
		static show(props) {
			const {
				parentWidget,
				successCallback = () => {},
			} = props;

			parentWidget.openWidget('layout', {
				titleParams: {
					text: Loc.getMessage('MAIL_ADDRESS_BOOK_ADD_ADDRESS'),
					largeMode: false,
					useLargeTitleMode: true,
				},
				backdrop: {
					mediumPositionPercent: 45,
					hideNavigationBar: false,
					forceDismissOnSwipeDown: true,
					shouldResizeContent: true,
					swipeAllowed: true,
				},
			})
				.then((widget) => {
					const component = new AddAddress({
						...props,
						layoutWidget: widget,
						successCallback,
					});
					widget.showComponent(component);
				})
				.catch(console.error);
		}

		componentWillUnmount()
		{
			this.onClose();
		}
	}

	module.exports = {
		AddAddress,
	};
});
