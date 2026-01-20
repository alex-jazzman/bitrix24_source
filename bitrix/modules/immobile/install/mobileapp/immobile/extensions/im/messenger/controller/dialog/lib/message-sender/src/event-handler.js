/**
 * @module im/messenger/controller/dialog/lib/message-sender/src/event-handler
 */
jn.define('im/messenger/controller/dialog/lib/message-sender/src/event-handler', (require, exports, module) => {
	const { EventType } = require('im/messenger/const');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('dialog--message-sender', 'MessageSender');

	/**
	 * @class SenderEventHandler
	 */
	class SenderEventHandler
	{
		/**
		 * @type {WeakRef<MessageSender>}
		 */
		#messageSender;

		/**
		 * @param {MessageSender} messageSender
		 * @param {DialogLocator} dialogLocator
		 */
		constructor(messageSender, dialogLocator)
		{
			this.#messageSender = new WeakRef(messageSender);
			/**
			 * @private
			 * @type {DialogLocator}
			 */
			this.dialogLocator = dialogLocator;
		}

		/**
		 * @return {MessageSender}
		 */
		get messageSender()
		{
			return this.#messageSender.deref();
		}

		/**
		 * @return {DialogView}
		 */
		get view()
		{
			return this.dialogLocator.get('view');
		}

		subscribeViewEvents()
		{
			this.view
				.on(EventType.dialog.resend, this.#viewResendHandler)
			;
			this.view.textField.on(EventType.dialog.textField.submit, this.#submitHandler);
		}

		unsubscribeViewEvents()
		{
			this.view
				.off(EventType.dialog.resend, this.#viewResendHandler)
			;
		}

		subscribeExternalEvents()
		{
			BX.addCustomEvent(EventType.dialog.external.resend, this.#externalResendHandler);
		}

		unsubscribeExternalEvents()
		{
			BX.removeCustomEvent(EventType.dialog.external.resend, this.#externalResendHandler);
		}

		#viewResendHandler = (index, message) => {
			return this.messageSender.resendMessage(index, message);
		};

		#submitHandler = (text) => {
			this.messageSender.sendTextMessage(text).catch((error) => {
				logger.error('submitHandler: sendMessage error', error);
			});
		};

		#externalResendHandler = (index, message) => {
			this.messageSender.resendMessage(index, message);
		};
	}

	module.exports = { SenderEventHandler };
});
