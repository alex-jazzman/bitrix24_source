/**
 * @module im/messenger/lib/element/dialog/message/contact/form
 */
jn.define('im/messenger/lib/element/dialog/message/contact/form', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { Color, Indent } = require('tokens');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons');
	const { PhoneInput } = require('ui-system/form/inputs/phone');
	const { StringInput, InputDesign, InputMode, InputSize } = require('ui-system/form/inputs/string');
	const { Area } = require('ui-system/layout/area');
	const { Box, BoxFooter } = require('ui-system/layout/box');
	const { getLogger } = require('im/messenger/lib/logger');
	const { Notification } = require('im/messenger/lib/ui/notification');

	const logger = getLogger('dialog-element--contactMessage');

	class ContactSaveForm extends LayoutComponent
	{
		static async open(contact, onSave)
		{
			const layoutWidget = await PageManager.openWidget('layout', {
				modal: true,
				titleParams: {
					type: 'dialog',
					text: Loc.getMessage('IMMOBILE_MESSENGER_CONTACT_FORM_TITLE'),
				},
			});
			layoutWidget.showComponent(new ContactSaveForm({ contact, onSave, layoutWidget }));

			return layoutWidget;
		}

		constructor(props)
		{
			super(props);
			this.state = {
				firstName: props.contact.firstName ?? '',
				secondName: props.contact.secondName ?? '',
				phones: props.contact.phones ?? [],
				isSaving: false,
			};
		}

		async submit()
		{
			if (this.state.isSaving)
			{
				return;
			}

			this.setState({ isSaving: true });

			try
			{
				const { firstName, secondName, phones } = this.state;
				await this.props.onSave({ firstName, secondName, phones });
				// The toast belongs to the chat this form was opened over, so it waits for the modal
				// to actually go away: shown earlier it appears in the closing layer and jumps as the
				// layers swap. Notification also gives it the messenger offset instead of the bare one.
				this.props.layoutWidget.close(() => {
					Notification.showToastWithParams({
						message: Loc.getMessage('IMMOBILE_MESSENGER_CONTACT_SAVE_SUCCESS'),
					});
				});
			}
			catch (error)
			{
				this.setState({ isSaving: false });
				logger.error(`${this.constructor.name}.submit`, error);
				Notification.showErrorToast({}, this.props.layoutWidget);
			}
		}

		render()
		{
			return Box(
				{
					testId: 'contact-save-form',
					backgroundColor: Color.bgSecondary,
					withScroll: true,
					resizableByKeyboard: true,
					safeArea: { bottom: true },
					scrollProps: { showsVerticalScrollIndicator: false },
					footer: this.#renderFooter(),
					onClick: () => Keyboard.dismiss(),
				},
				Area(
					{
						testId: 'contact-save-form-area',
						isFirst: true,
					},
					this.#renderFirstNameInput(),
					this.#renderLastNameInput(),
					...this.#renderPhoneInputs(),
				),
			);
		}

		#renderFirstNameInput()
		{
			return StringInput({
				testId: 'contact-save-first-name',
				value: this.state.firstName,
				label: Loc.getMessage('IMMOBILE_MESSENGER_CONTACT_FORM_FIRST_NAME'),
				size: InputSize.L,
				design: InputDesign.GREY,
				mode: InputMode.STROKE,
				autoCapitalize: 'words',
				onChange: (firstName) => this.setState({ firstName }),
				style: { marginBottom: Indent.M.toNumber() },
			});
		}

		#renderLastNameInput()
		{
			return StringInput({
				testId: 'contact-save-last-name',
				value: this.state.secondName,
				label: Loc.getMessage('IMMOBILE_MESSENGER_CONTACT_FORM_LAST_NAME'),
				size: InputSize.L,
				design: InputDesign.GREY,
				mode: InputMode.STROKE,
				autoCapitalize: 'words',
				onChange: (secondName) => this.setState({ secondName }),
				style: this.state.phones.length > 0 ? { marginBottom: Indent.M.toNumber() } : {},
			});
		}

		#renderPhoneInputs()
		{
			return this.state.phones.map((phone, index) => PhoneInput({
				testId: `contact-save-phone-${index}`,
				value: phone,
				size: InputSize.L,
				design: InputDesign.GREY,
				mode: InputMode.STROKE,
				showDefaultCountryPhoneCode: false,
				onChange: (value) => {
					const phones = [...this.state.phones];
					phones[index] = value;
					this.setState({ phones });
				},
				style: index < this.state.phones.length - 1 ? { marginBottom: Indent.M.toNumber() } : {},
			}));
		}

		#renderFooter()
		{
			const { isSaving } = this.state;
			const text = Loc.getMessage('IMMOBILE_MESSENGER_CONTACT_FORM_SAVE');
			const buttonProps = {
				text,
				design: ButtonDesign.FILLED,
				disabled: isSaving,
				loading: isSaving,
				onClick: () => this.submit(),
			};

			return BoxFooter(
				{
					testId: 'contact-save-footer',
					keyboardButton: {
						...buttonProps,
						testId: 'contact-save-submit-keyboard',
					},
				},
				Button({
					...buttonProps,
					testId: 'contact-save-submit',
					size: ButtonSize.L,
					stretched: true,
				}),
			);
		}
	}

	module.exports = { ContactSaveForm };
});
