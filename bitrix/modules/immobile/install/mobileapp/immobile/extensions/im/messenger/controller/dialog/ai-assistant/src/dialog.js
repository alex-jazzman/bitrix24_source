/* eslint-disable es/no-nullish-coalescing-operators */

/**
 * @module im/messenger/controller/dialog/ai-assistant/dialog
 */
jn.define('im/messenger/controller/dialog/ai-assistant/dialog', (require, exports, module) => {
	const { AiAssistantButtonType, EventType, DialogWidgetType } = require('im/messenger/const');
	const { getLogger } = require('im/messenger/lib/logger');

	const { Dialog } = require('im/messenger/controller/dialog/chat');
	const { DialogTextHelper } = require('im/messenger/controller/dialog/lib/helper/text');

	const { AiAssistantMessageMenu } = require('im/messenger/controller/dialog/ai-assistant/component/message-menu');

	const logger = getLogger('dialog--dialog');

	/**
	 * @class AiAssistantDialog
	 */
	class AiAssistantDialog extends Dialog
	{
		constructor()
		{
			super();

			this.messageButtonTapHandler = this.messageButtonTapHandler.bind(this);
			this.footnoteTapHandler = this.footnoteTapHandler.bind(this);
		}

		getDialogType()
		{
			return DialogWidgetType.aiAssistant;
		}

		checkCanHaveAttachments()
		{
			return false;
		}

		checkCanRecordAudio() {
			return false;
		}

		subscribeViewEvents()
		{
			super.subscribeViewEvents();
			this.disableParentClassViewEvents();
			this.subscribeCustomViewEvents();
		}

		disableParentClassViewEvents()
		{}

		subscribeCustomViewEvents()
		{
			this.view
				.on(EventType.dialog.messageButtonTap, this.messageButtonTapHandler)
			;
			this.view
				.on(EventType.dialog.footnoteTap, this.footnoteTapHandler)
			;
		}

		/**
		 * @return {MessageMenuController}
		 */
		createMessageMenu()
		{
			return new AiAssistantMessageMenu(this.getMessageMenuParams());
		}

		/**
		 *
		 * @param messageId
		 * @param {MessageButton} button
		 */
		messageButtonTapHandler(messageId, button)
		{
			logger.log(`${this.constructor.name}.messageButtonTapHandler`, messageId, button);

			if (button.id === AiAssistantButtonType.copy)
			{
				const modelMessage = this.store.getters['messagesModel/getById'](messageId);
				DialogTextHelper.copyToClipboard(
					modelMessage.text,
					{
						parentWidget: this.view.ui,
					},
				);

				return true;
			}

			return false;
		}

		footnoteTapHandler()
		{
			const articleCode = '25754438';
			logger.log('Dialog.footnoteTapHandler, articleCode:', articleCode);
			helpdesk.openHelpArticle(articleCode, 'helpdesk');
		}
	}

	module.exports = { AiAssistantDialog };
});
