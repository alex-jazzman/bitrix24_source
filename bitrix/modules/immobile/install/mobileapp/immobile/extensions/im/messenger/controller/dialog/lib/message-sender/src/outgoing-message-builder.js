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
	}

	module.exports = { OutgoingMessageBuilder };
});
