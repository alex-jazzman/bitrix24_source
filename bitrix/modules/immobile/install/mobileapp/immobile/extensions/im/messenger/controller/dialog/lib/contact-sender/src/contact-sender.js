/**
 * @module im/messenger/controller/dialog/lib/contact-sender/src/contact-sender
 */
jn.define('im/messenger/controller/dialog/lib/contact-sender/src/contact-sender', (require, exports, module) => {
	const { Type } = require('type');
	const { SmartphoneContactSelector } = require('layout/ui/smartphone-contact-selector');
	const { Loc } = require('im/messenger/loc');
	const { SendingService } = require('im/messenger/provider/services/sending');
	const { getLogger } = require('im/messenger/lib/logger');

	const logger = getLogger('dialog--contact-sender');

	const prepareContact = (selectedContact, source = {}) => {
		const sourcePhones = (source.phoneNumbers ?? []).map((phone) => phone.value);

		return {
			firstName: selectedContact.firstName ?? null,
			secondName: selectedContact.secondName ?? null,
			phones: [
				selectedContact.phone,
				...sourcePhones.filter((phone) => phone !== selectedContact.phone),
			],
			photoUrl: source.avatar ?? null,
		};
	};

	// The address book returns a record once per container that holds it, and saving a received card
	// adds a copy of its own, so one selected row matches several source rows at once. Rows agreeing on
	// the full name and on the selected phone are the same person, so the card takes its numbers from
	// the first of them and the photo from the first row that carries one: every copy exports the photo
	// under its own identifier, and the paths of two copies never match.
	const findSourceContact = (selectedContact, sourceContacts = []) => {
		const matchedContacts = sourceContacts.filter((contact) => (
			contact.phoneNumber === selectedContact.phone
				&& contact.firstName === selectedContact.firstName
				&& contact.secondName === selectedContact.secondName
		));

		const [firstMatch] = matchedContacts;
		if (!firstMatch)
		{
			return null;
		}

		const contactWithPhoto = matchedContacts.find((contact) => Type.isStringFilled(contact.avatar));

		return contactWithPhoto ? { ...firstMatch, avatar: contactWithPhoto.avatar } : firstMatch;
	};

	class ContactSender
	{
		constructor({
			dialogId,
			messageSender,
			parentLayout,
			sendingService = new SendingService(),
			selectorClass = SmartphoneContactSelector,
		})
		{
			this.dialogId = dialogId;
			this.messageSender = messageSender;
			this.parentLayout = parentLayout;
			this.sendingService = sendingService;
			this.selectorClass = selectorClass;
		}

		open()
		{
			let isSendingStarted = false;
			const startSending = (selectedContact, selectorInstance) => {
				if (isSendingStarted || !selectedContact)
				{
					return;
				}

				isSendingStarted = true;
				void this.send(selectedContact, selectorInstance);
			};

			const selector = new this.selectorClass({
				parentLayout: this.parentLayout,
				title: Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_VIEW_INPUT_ATTACH_CONTACT') || undefined,
				allowMultipleSelection: false,
				allowPhoneNumberInput: false,
				closeAfterSendButtonClick: true,
				onSelectionChanged: () => {
					const [selectedContact] = selector.getSelectedContacts();
					if (!selectedContact)
					{
						return;
					}

					selector.close();
					startSending(selectedContact, selector);
				},
				// The manual phone-number branch of the selector reports through the send button only.
				onSendButtonClickHandler: (selectedContacts, selectorInstance) => {
					startSending(selectedContacts[0], selectorInstance);
				},
			});

			return selector.open();
		}

		async send(selectedContact, selector)
		{
			if (!selectedContact)
			{
				return;
			}

			const source = findSourceContact(selectedContact, selector.allContacts) ?? {};
			const contact = prepareContact(selectedContact, source);
			let photoId = null;
			if (contact.photoUrl)
			{
				try
				{
					photoId = await this.sendingService.uploadContactPhoto(this.dialogId, contact.photoUrl);
				}
				catch (error)
				{
					logger.error(`${this.constructor.name}.uploadContactPhoto`, error);
				}
				finally
				{
					this.sendingService.unsubscribeEvents();
				}

				if (!photoId)
				{
					logger.warn(`${this.constructor.name}.uploadContactPhoto: contact card is sent without a photo`);
				}
			}

			await this.messageSender.sendContactMessage({
				...contact,
				...(photoId ? { photoId } : {}),
			});
		}
	}

	module.exports = { ContactSender, prepareContact, findSourceContact };
});
