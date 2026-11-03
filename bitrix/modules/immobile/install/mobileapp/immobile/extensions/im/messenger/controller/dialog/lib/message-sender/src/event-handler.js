/**
 * @module im/messenger/controller/dialog/lib/message-sender/src/event-handler
 */
jn.define('im/messenger/controller/dialog/lib/message-sender/src/event-handler', (require, exports, module) => {
	const { EventType } = require('im/messenger/const');
	const { Feature } = require('im/messenger/lib/feature');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');
	const { AnalyticsService } = require('im/messenger/provider/services/analytics');

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
		 * @desc Guard for the currently applied send button stop state; the native contract
		 * is touched only on a real state change.
		 * @type {boolean}
		 */
		#isStopStateApplied = false;

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

		/**
		 * @return {DialogTextField}
		 */
		get textField()
		{
			return this.view?.textField ?? null;
		}

		/**
		 * @return {string}
		 */
		get dialogId()
		{
			return String(this.dialogLocator.get('dialogId'));
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

		subscribeStoreEvents()
		{
			if (!Feature.isStopGenerationAvailable)
			{
				return;
			}

			this.messageSender.storeManager
				.on('dialoguesModel/add', this.#dialogMutationHandler)
				.on('dialoguesModel/update', this.#dialogMutationHandler)
			;

			// apply the state already known before the subscription (chat-load may have
			// put 'generating' on dialog opening); pull will reconcile it later
			this.#refreshStopState();
		}

		unsubscribeStoreEvents()
		{
			if (!Feature.isStopGenerationAvailable)
			{
				return;
			}

			this.messageSender.storeManager
				.off('dialoguesModel/add', this.#dialogMutationHandler)
				.off('dialoguesModel/update', this.#dialogMutationHandler)
			;
		}

		#viewResendHandler = (index, message) => {
			return this.messageSender.resendMessage(index, message);
		};

		#submitHandler = (text) => {
			// the native send button emits a plain 'submit' in any state (including 'stop'),
			// so a live predicate decides whether this tap stops the generation or sends text
			if (this.messageSender.isStopStateActive())
			{
				AnalyticsService.getInstance().sendClickStopGeneration(this.dialogId);

				this.messageSender.stopGeneration().catch((error) => {
					logger.error('submitHandler: stopGeneration error', error);
				});

				return;
			}

			this.messageSender.sendTextMessage(text).catch((error) => {
				logger.error('submitHandler: sendMessage error', error);
			});
		};

		/**
		 * @param {MutationEvent<DialoguesUpdateData>} mutation
		 */
		#dialogMutationHandler = (mutation) => {
			const dialogId = mutation?.payload?.data?.dialogId;
			if (String(dialogId) !== this.dialogId)
			{
				return;
			}

			this.#refreshStopState();
		};

		#refreshStopState()
		{
			const isStopState = this.messageSender.isStopStateActive();
			if (isStopState === this.#isStopStateApplied)
			{
				return;
			}

			this.#applyStopState(isStopState);
		}

		/**
		 * @desc Native send button contract 'chat_send_button_v2': the methods appear on the
		 * text field only on builds with the branch, so all calls are optional. Until then the
		 * button keeps its regular behavior.
		 * @param {boolean} isStopState
		 */
		#applyStopState(isStopState)
		{
			const textField = this.textField;
			if (!textField)
			{
				return;
			}

			logger.log('SenderEventHandler.applyStopState:', this.dialogId, isStopState);

			if (isStopState)
			{
				textField.setSendButtonToForcedState?.(true);
				textField.setSendButtonState?.('stop');
			}
			else
			{
				// pick the state by the actual input before dropping the force, so an empty
				// field does not flash the active 'filled' button on the way to 'disabled'
				const stateId = textField.getText?.() ? 'filled' : 'disabled';
				textField.setSendButtonState?.(stateId);
				textField.setSendButtonToForcedState?.(false);
			}

			this.#isStopStateApplied = isStopState;
		}

		#externalResendHandler = (index, message) => {
			this.messageSender.resendMessage(index, message);
		};
	}

	module.exports = { SenderEventHandler };
});
