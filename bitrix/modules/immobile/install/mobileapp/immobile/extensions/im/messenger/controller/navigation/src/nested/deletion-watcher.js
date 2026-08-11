/**
 * @module im/messenger/controller/navigation/src/nested/deletion-watcher
 */
jn.define('im/messenger/controller/navigation/src/nested/deletion-watcher', (require, exports, module) => {
	const { EventType } = require('im/messenger/const');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('navigation--deletion-watcher', 'NestedDeletionWatcher');

	/**
	 * @class NestedDeletionWatcher
	 *
	 * Per nested-navigation lazy self-close, mirroring the Dialog screen mechanic
	 * (isChatDeleted + showHandler). When the project that owns this nested navigation
	 * is gone (chat.deleted for its chat), the navigation closes itself: now if it is
	 * the visible screen, otherwise on its next show. Foreign screens above or
	 * interleaved are never touched — each dead screen collapses only when it surfaces.
	 */
	class NestedDeletionWatcher
	{
		#chatId;
		#widget;
		#isShown = true;
		#dead = false;

		/**
		 * @param {object} params
		 * @param {number} params.chatId — project chatId that owns this nested navigation
		 * @param {object} params.widget — the nested-nav widget
		 */
		constructor({ chatId, widget })
		{
			this.#chatId = chatId;
			this.#widget = widget;

			BX.addCustomEvent(EventType.chat.deleted, this.#onChatDeleted);
			this.#widget?.on(EventType.view.show, this.#onShow);
			this.#widget?.on(EventType.view.hidden, this.#onHidden);
		}

		#onChatDeleted = (event) => {
			if (this.#dead || Number(event?.chatId) !== Number(this.#chatId))
			{
				return;
			}

			this.#dead = true;
			logger.log('project gone, nested navigation marked dead', this.#chatId);

			if (this.#isShown)
			{
				this.#close();
			}
		};

		#onShow = () => {
			this.#isShown = true;
			if (this.#dead)
			{
				this.#close();
			}
		};

		#onHidden = () => {
			this.#isShown = false;
		};

		#close()
		{
			logger.log('nested navigation self-close', this.#chatId);
			this.#widget?.back();
		}

		destroy()
		{
			BX.removeCustomEvent(EventType.chat.deleted, this.#onChatDeleted);
			this.#widget?.off(EventType.view.show, this.#onShow);
			this.#widget?.off(EventType.view.hidden, this.#onHidden);
			this.#widget = null;
		}
	}

	module.exports = { NestedDeletionWatcher };
});
