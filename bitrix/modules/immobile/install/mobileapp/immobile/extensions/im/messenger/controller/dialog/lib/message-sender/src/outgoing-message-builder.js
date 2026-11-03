/**
 * @module im/messenger/controller/dialog/lib/message-sender/src/outgoing-message-builder
 */
jn.define('im/messenger/controller/dialog/lib/message-sender/src/outgoing-message-builder', (require, exports, module) => {
	const { mergeImmutable } = require('utils/object');

	const { serviceLocator } = require('im/messenger/lib/di/service-locator');

	/**
	 * @class OutgoingMessageBuilder
	 */
	class OutgoingMessageBuilder
	{
		constructor(dialogId, templateId)
		{
			this.dialogId = dialogId;
			this.templateId = templateId;

			/**
			 * @type {Partial<MessagesModelState>}
			 */
			this.state = {};

			this.#initState();
		}

		get currentUserId()
		{
			return serviceLocator.get('core').getUserId();
		}

		get store()
		{
			return serviceLocator.get('core').getStore();
		}

		get chatId()
		{
			return this.store.getters['dialoguesModel/getById'](this.dialogId).chatId;
		}

		#initState()
		{
			this.state = {
				chatId: this.chatId,
				authorId: this.currentUserId,
				unread: false,
				templateId: this.templateId,
				date: new Date(),
				sending: true,
				params: {},
			};
		}

		getMessageState()
		{
			return this.state;
		}

		/**
		 * @param {keyof MessagesModelState['params']} name
		 * @param value
		 */
		addParam(name, value)
		{
			this.state.params = mergeImmutable(this.state.params, { [name]: value });
		}

		/**
		 * @param {keyof MessagesModelState} name
		 * @param value
		 */
		addProperty(name, value)
		{
			this.state[name] = value;
		}

		addContact(contact)
		{
			const params = {
				...(contact.firstName ? { firstName: contact.firstName } : {}),
				...(contact.secondName ? { lastName: contact.secondName } : {}),
				phones: contact.phones,
			};
			const name = [params.lastName, params.firstName].filter(Boolean).join(' ');
			const text = [name, params.phones[0]].filter(Boolean).join(', ');

			this.addProperty('text', text);
			this.addParam('COMPONENT_ID', 'ContactMessage');
			this.addParam('COMPONENT_PARAMS', params);
			if (contact.photoId)
			{
				this.addProperty('files', [contact.photoId]);
			}

			return {
				...(params.firstName ? { firstName: params.firstName } : {}),
				...(params.lastName ? { lastName: params.lastName } : {}),
				phones: params.phones,
				...(contact.photoId ? { photoId: contact.photoId } : {}),
			};
		}
	}

	module.exports = { OutgoingMessageBuilder };
});
