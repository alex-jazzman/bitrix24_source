/**
 * @module im/messenger/lib/element/dialog/message/ai-bizproc/handler
 */
jn.define('im/messenger/lib/element/dialog/message/ai-bizproc/handler', (require, exports, module) => {
	const { EventType, MessageParams } = require('im/messenger/const');
	const { CustomMessageHandler } = require('im/messenger/lib/element/dialog/message/custom/handler');

	/**
	 * @class AiBizprocMessageHandler
	 */
	class AiBizprocMessageHandler extends CustomMessageHandler
	{
		bindMethods()
		{
			this.footnoteTapHandler = this.footnoteTapHandler.bind(this);
		}

		subscribeEvents()
		{
			this.dialogLocator.get('view')
				.on(EventType.dialog.footnoteTap, this.footnoteTapHandler)
			;
		}

		unsubscribeEvents()
		{
			this.dialogLocator.get('view')
				.off(EventType.dialog.footnoteTap, this.footnoteTapHandler)
			;
		}

		footnoteTapHandler(messageId)
		{
			const store = this.serviceLocator.get('core').getStore();
			const modelMessage = store.getters['messagesModel/getById'](messageId);
			if (!modelMessage.id || modelMessage.params?.componentId !== MessageParams.ComponentId.AiBizprocMessage)
			{
				return;
			}

			const articleCode = '27777462';
			helpdesk.openHelpArticle(articleCode, 'helpdesk');
		}
	}

	module.exports = {
		AiBizprocMessageHandler,
	};
});
