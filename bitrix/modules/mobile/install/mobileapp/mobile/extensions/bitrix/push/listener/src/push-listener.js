/**
 * @module push/listener/src/push-listener
 */
jn.define('push/listener/src/push-listener', (require, exports, module) => {
	const { ApplicationMessage } = require('push/message');

	const SHOW_NOTIFICATION_FOR_SECONDS = 10;
	const PENDING_MESSAGE_TTL_MS = 60000;
	include('InAppNotifier');

	/**
	 * @class PushListener
	 */
	class PushListener
	{
		constructor()
		{
			this.events = {};
			this.latestMessageId = null;
			this.pendingMessages = {};
		}

		/**
		 * @param {string} messageType
		 * @param {Function} callback
		 */
		subscribe(messageType, callback)
		{
			if (!this.events[messageType])
			{
				this.events[messageType] = [];
			}

			const emptyFn = () => {};
			const handler = typeof callback === 'function' ? callback : emptyFn;

			this.events[messageType].push(handler);

			this.schedulePendingMessagesFlush(messageType);
		}

		/**
		 * @param {string} messageType
		 */
		schedulePendingMessagesFlush(messageType)
		{
			if (!this.pendingMessages[messageType])
			{
				return;
			}

			// deferred past the subscriber constructor, see BaseNotificationHandler
			setTimeout(() => this.flushPendingMessages(messageType), 0);
		}

		/**
		 * @param {string} messageType
		 */
		flushPendingMessages(messageType)
		{
			const pending = this.pendingMessages[messageType];
			if (!pending)
			{
				return;
			}

			delete this.pendingMessages[messageType];

			if (Date.now() - pending.bufferedAt > PENDING_MESSAGE_TTL_MS)
			{
				return;
			}

			this.handle(pending.message);
		}

		/**
		 * @param {Message} message
		 */
		bufferPendingMessage(message)
		{
			this.pendingMessages[message.type] = { message, bufferedAt: Date.now() };
		}

		/**
		 * @param {string} messageType
		 */
		unsubscribe(messageType)
		{
			delete this.events[messageType];
		}

		/**
		 * @param {Message} message
		 */
		handle(message)
		{
			if (this.messageAlreadyProcessed(message))
			{
				return;
			}

			if (!this.subscribedTo(message))
			{
				// buffered until a subscriber registers, otherwise a cold start tap is lost
				this.bufferPendingMessage(message);

				return;
			}

			this.latestMessageId = message.id;

			if (message instanceof ApplicationMessage && message.hasBody())
			{
				this.displayApplicationNotification(message);
			}
			else
			{
				this.executeCallbacks(message);
			}
		}

		/**
		 * @param {Message} message
		 * @returns {boolean}
		 */
		messageAlreadyProcessed(message)
		{
			return message.id === this.latestMessageId;
		}

		/**
		 * @param {Message} message
		 * @returns {boolean}
		 */
		subscribedTo(message)
		{
			const type = message.type;

			return this.events[type] && this.events[type].length > 0;
		}

		/**
		 * @param {Message} message
		 */
		executeCallbacks(message)
		{
			const callbacks = this.events[message.type];
			if (callbacks && callbacks.length > 0)
			{
				callbacks.forEach((callback) => callback(message));
			}
		}

		/**
		 * @param {Message} message
		 */
		displayApplicationNotification(message)
		{
			InAppNotifier.setHandler(() => this.executeCallbacks(message));
			InAppNotifier.showNotification({
				title: message.title,
				backgroundColor: '#e6000000',
				message: message.body,
				time: SHOW_NOTIFICATION_FOR_SECONDS,
				imageUrl: message.imageUrl,
			});
		}
	}

	module.exports = {
		PushListener,
	};
});
