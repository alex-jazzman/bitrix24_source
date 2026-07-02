/**
 * @module im/messenger/controller/dialog/lib/optimistic-chat-manager/manager
 */
jn.define('im/messenger/controller/dialog/lib/optimistic-chat-manager/manager', (require, exports, module) => {
	const { VisibilityManager } = require('im/messenger/lib/visibility-manager');

	/**
	 * @class OptimisticChatManager
	 */
	class OptimisticChatManager
	{
		/** @type {Set<(string, DialogLocator) => void>} */
		static #restoreCallbacks = new Set();

		/**
		 * @param {string} chatType
		 * @param {DialogLocator} dialogLocator
		 */
		static restore(chatType, dialogLocator)
		{
			for (const callback of OptimisticChatManager.#restoreCallbacks)
			{
				callback(chatType, dialogLocator);
			}
		}

		/** @type {OptimisticHandler[]} */
		#handlers;
		/** @type {Promise<{ chatId: number }>} */
		#loadingPromise;
		/** @type {DialogLocator} */
		#dialogLocator;
		/** @type {boolean} */
		#isPending = true;

		/**
		 * @param {Object} params
		 * @param {Promise<{ chatId: number }>} params.loadingPromise
		 * @param {DialogLocator} params.dialogLocator
		 * @param {OptimisticHandler[]} params.handlers
		 */
		constructor({ loadingPromise, dialogLocator, handlers = [] })
		{
			this.#loadingPromise = loadingPromise;
			this.#dialogLocator = dialogLocator;
			this.#handlers = handlers;

			for (const handler of handlers)
			{
				if (handler.constructor.restore)
				{
					OptimisticChatManager.#restoreCallbacks.add(handler.constructor.restore);
				}
			}
		}

		get isPending()
		{
			return this.#isPending;
		}

		start()
		{
			for (const handler of this.#handlers)
			{
				handler.onStart();
			}

			return this.#loadingPromise
				.then((result) => {
					if (!this.#isPending)
					{
						return;
					}

					this.#isPending = false;

					for (const handler of this.#handlers)
					{
						handler.onResolve();
					}

					// eslint-disable-next-line consistent-return
					return { chatId: result.chatId };
				})
			;
		}

		/**
		 * Finalizes all handlers after the dialog is fully initialized.
		 * @return {Object}
		 */
		complete()
		{
			const handlerResults = {};
			for (const handler of this.#handlers)
			{
				if (handler.complete)
				{
					Object.assign(handlerResults, handler.complete());
				}
			}

			return handlerResults;
		}

		/**
		 * @param {() => any} onClose
		 * @return {Promise<void>}
		 */
		async cancelWithSave(onClose)
		{
			if (!this.#isPending)
			{
				return;
			}

			this.#isPending = false;

			for (const handler of this.#handlers)
			{
				handler.onCancel();
			}

			onClose();
			const dialogCode = this.#dialogLocator.get('dialogCode');
			await VisibilityManager.getInstance()?.removeVisibleDialogInfoByDialogCode(dialogCode);
		}

		cancel()
		{
			if (!this.#isPending)
			{
				return;
			}

			this.#isPending = false;

			for (const handler of this.#handlers)
			{
				handler.onCancel();
			}
		}
	}

	module.exports = { OptimisticChatManager };
});
