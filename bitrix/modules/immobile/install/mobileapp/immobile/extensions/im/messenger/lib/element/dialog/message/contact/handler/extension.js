/**
 * @module im/messenger/lib/element/dialog/message/contact/handler
 */
jn.define('im/messenger/lib/element/dialog/message/contact/handler', (require, exports, module) => {
	const { requireLazy } = require('require-lazy');
	const { contacts } = require('native/contacts');
	const { showErrorToast } = require('toast/error');
	const { EventType } = require('im/messenger/const');
	const { getLogger } = require('im/messenger/lib/logger');
	const { CustomMessageHandler } = require('im/messenger/lib/element/dialog/message/custom/handler');

	const logger = getLogger('dialog-element--contactMessage');

	class ContactMessageHandler extends CustomMessageHandler
	{
		bindMethods()
		{
			this.contactSaveTapHandler = this.contactSaveTapHandler.bind(this);
		}

		subscribeEvents()
		{
			this.dialogLocator.get('view').on(EventType.dialog.contactSaveTap, this.contactSaveTapHandler);
		}

		unsubscribeEvents()
		{
			this.dialogLocator.get('view').off(EventType.dialog.contactSaveTap, this.contactSaveTapHandler);
		}

		async contactSaveTapHandler(message)
		{
			const messageId = message?.id ?? message;
			const store = this.serviceLocator.get('core').getStore();
			const modelMessage = store.getters['messagesModel/getById'](messageId);
			const params = modelMessage?.params?.COMPONENT_PARAMS;
			if (!params || typeof contacts?.saveContact !== 'function')
			{
				return;
			}

			try
			{
				const { ContactSaveForm } = await requireLazy(
					'im:messenger/lib/element/dialog/message/contact/form',
				) ?? {};
				if (!ContactSaveForm)
				{
					throw new Error('ContactSaveForm extension is unavailable');
				}

				await ContactSaveForm.open({
					firstName: params.firstName,
					secondName: params.lastName,
					phones: Array.isArray(params.phones) ? params.phones : [],
				}, async (formContact) => {
					await contacts.saveContact({
						...formContact,
						photo: this.#getPhotoUrl(messageId),
					});
				});
			}
			catch (error)
			{
				logger.error(`${this.constructor.name}.contactSaveTapHandler`, error);
				showErrorToast();
			}
		}

		#getPhotoUrl(messageId)
		{
			const store = this.serviceLocator.get('core').getStore();
			const files = store.getters['filesModel/getListByMessageId'](messageId) || [];
			const image = files.find((file) => file.type === 'image');

			return image?.urlDownload || image?.urlPreview || image?.localUrl || null;
		}
	}

	module.exports = { ContactMessageHandler };
});
