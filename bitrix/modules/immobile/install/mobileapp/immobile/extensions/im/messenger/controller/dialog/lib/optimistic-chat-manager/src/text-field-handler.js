/**
 * @module im/messenger/controller/dialog/lib/optimistic-chat-manager/text-field-handler
 */
jn.define('im/messenger/controller/dialog/lib/optimistic-chat-manager/text-field-handler', (require, exports, module) => {
	const { EventType } = require('im/messenger/const');
	const { Loc } = require('im/messenger/controller/dialog/lib/loc');
	const { OptimisticAssistantButtonManager } = require('im/messenger/controller/dialog/lib/optimistic-chat-manager/assistant-button-manager');

	/**
	 * @class TextFieldOptimisticHandler
	 */
	class TextFieldOptimisticHandler
	{
		/** @type {Map<string, string>} */
		static #savedTexts = new Map();

		/**
		 * Restores previously typed text when reopening a dialog in normal flow.
		 * @param {string} chatType
		 * @param {DialogLocator} dialogLocator
		 */
		static restore(chatType, dialogLocator)
		{
			const text = TextFieldOptimisticHandler.#savedTexts.get(chatType);
			if (!text)
			{
				return;
			}

			TextFieldOptimisticHandler.#savedTexts.delete(chatType);
			dialogLocator.get('view').textField?.setText(text);
		}

		#chatType;
		#dialogLocator;
		#pendingText = '';
		#changeTextHandler;

		/**
		 * @param {Object} params
		 * @param {string} params.chatType
		 * @param {DialogLocator} params.dialogLocator
		 */
		constructor({ chatType, dialogLocator })
		{
			this.#chatType = chatType;
			this.#dialogLocator = dialogLocator;
			this.#changeTextHandler = this.#onChangeText.bind(this);
		}

		/**
		 * Called when the optimistic phase starts. Initializes the text field, subscribes to input events,
		 * and restores any previously saved text.
		 */
		onStart()
		{
			this.#initOptimisticTextField();
			this.#subscribeEvents();
			this.#restoreSavedText();
		}

		/**
		 * Called when the user closes the dialog before chat creation completes.
		 * Saves the current text so it can be restored on the next open.
		 */
		onCancel()
		{
			this.#unsubscribeEvents();
			if (this.#pendingText)
			{
				TextFieldOptimisticHandler.#savedTexts.set(this.#chatType, this.#pendingText);
			}
		}

		/**
		 * Called when the chat is successfully created.
		 * Keeps the subscription alive so that text typed during async initialization is not lost.
		 */
		onResolve()
		{
			TextFieldOptimisticHandler.#savedTexts.delete(this.#chatType);
		}

		/**
		 * Called after the dialog is fully initialized.
		 * Unsubscribes from events and returns the accumulated text.
		 * @return {{ pendingText: string }}
		 */
		complete()
		{
			this.#unsubscribeEvents();

			return { pendingText: this.#pendingText };
		}

		#initOptimisticTextField()
		{
			const view = this.#dialogLocator.get('view');
			view.setInputPlaceholder(Loc.getMessage('IMMOBILE_MESSENGER_DIALOG_INPUT_PLACEHOLDER_TEXT_V2'));
			void view.showAssistantButtons(OptimisticAssistantButtonManager.buildButtons(this.#chatType));
			view.showTextField(true);
			view.hideChatJoinButton();
		}

		#restoreSavedText()
		{
			const text = TextFieldOptimisticHandler.#savedTexts.get(this.#chatType);
			if (text)
			{
				TextFieldOptimisticHandler.#savedTexts.delete(this.#chatType);
				this.#dialogLocator.get('view').textField?.setText(text);
			}
		}

		#subscribeEvents()
		{
			this.#dialogLocator.get('view').textField
				.on(EventType.dialog.textField.changeText, this.#changeTextHandler)
			;
		}

		#unsubscribeEvents()
		{
			this.#dialogLocator.get('view')?.textField
				.off(EventType.dialog.textField.changeText, this.#changeTextHandler)
			;
		}

		#onChangeText(text)
		{
			this.#pendingText = text;
		}
	}

	module.exports = { TextFieldOptimisticHandler };
});
