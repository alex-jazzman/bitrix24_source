/**
 * @module im/messenger/lib/element/dialog/message/contact/message
 */
jn.define('im/messenger/lib/element/dialog/message/contact/message', (require, exports, module) => {
	const { Loc } = require('im/messenger/loc');
	const { AvatarClass, AvatarShape, AvatarEntityType } = require('ui-system/blocks/avatar');
	const { FileType, MessageComponent, MessageType, ButtonDesignType } = require('im/messenger/const');
	const { ButtonSize } = require('ui-system/form/buttons');
	const { Feature } = require('im/messenger/lib/feature');
	const { CustomMessage } = require('im/messenger/lib/element/dialog/message/custom/message');

	class ContactMessage extends CustomMessage
	{
		constructor(modelMessage, options = {})
		{
			super(modelMessage, options);

			const params = this.getComponentParams();
			const name = [params.lastName, params.firstName].filter(Boolean).join(' ');
			const phones = Array.isArray(params.phones) ? params.phones : [];
			const imageFile = this.getModelFiles().find((file) => file.type === FileType.image);
			const imageUri = imageFile?.urlPreview || imageFile?.localUrl || imageFile?.urlDownload || '';

			this.contact = {
				avatar: AvatarClass.getAvatar({
					name,
					uri: imageUri,
					shape: AvatarShape.CIRCLE,
					entityType: AvatarEntityType.USER,
					testId: `message-${this.id}-contact-avatar`,
				}).getAvatarNativeProps(),
				...ContactMessage.buildCardFields(name, phones),
			};

			const caption = ContactMessage.extractCaption(modelMessage.text, name, phones[0] ?? '');
			if (caption !== '')
			{
				this.setMessage(caption, { dialogId: options.dialogId });
			}

			const saveButton = ContactMessage.createSaveButton(this.id);
			if (saveButton)
			{
				this.contact.button = saveButton;
			}
		}

		static createSaveButton(messageId)
		{
			if (!Feature.isContactSaveSupported)
			{
				return null;
			}

			return {
				id: 'save_contact',
				text: Loc.getMessage('IMMOBILE_MESSENGER_CONTACT_SAVE_BUTTON'),
				design: ButtonDesignType.outlineAccent2,
				height: ButtonSize.S.getName(),
				testId: Application.getPlatform() === 'ios' ? `message-${messageId}-contact-save` : undefined,
			};
		}

		// A contact without a name is titled by its first phone, and the phone line below it is then
		// dropped so the same number is not printed twice. The avatar is built from the real name:
		// a phone number yields no initials, and an empty title gives the placeholder instead.
		static buildCardFields(name, phones)
		{
			if (name !== '')
			{
				return { name, phones };
			}

			return { name: phones[0] ?? '', phones: [] };
		}

		static extractCaption(text, name, phone)
		{
			const cardLine = name === '' ? phone : `${name}, ${phone}`;
			if (text === cardLine)
			{
				return '';
			}

			const cardLineSuffix = `\n${cardLine}`;
			if (!text.endsWith(cardLineSuffix))
			{
				return '';
			}

			return text.slice(0, -cardLineSuffix.length);
		}

		static getComponentId()
		{
			return MessageComponent.contact;
		}

		getType()
		{
			return MessageType.contact;
		}

		get metaData()
		{
			return {};
		}

		toDialogWidgetItem()
		{
			return {
				...super.toDialogWidgetItem(),
				contact: this.contact,
			};
		}
	}

	module.exports = { ContactMessage };
});
