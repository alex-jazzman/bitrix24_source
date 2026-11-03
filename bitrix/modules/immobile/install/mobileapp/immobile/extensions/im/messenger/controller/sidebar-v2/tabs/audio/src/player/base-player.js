/**
 * @module im/messenger/controller/sidebar-v2/tabs/audio/src/player/base-player
 */
jn.define('im/messenger/controller/sidebar-v2/tabs/audio/src/player/base-player', (require, exports, module) => {
	const { getLogger } = require('im/messenger/lib/logger');
	const { AudioEvents } = require('im/messenger/const');
	const logger = getLogger('sidebar-v2-audio-controller');

	class BaseAudioPlayer
	{
		/**
		 * @param {SidebarAudioPlayerProps} props
		 */
		constructor(props)
		{
			this.items = [];
			this.listeners = new Map();
			this.player = null;
			this.store = props.store;
			this.chatId = props.chatId;
			this.props = props;
		}

		/**
		 * @abstract
		 */
		start()
		{}

		/**
		 * @abstract
		 */
		createPlayer()
		{}

		/**
		 * @param {Array<SidebarTabListItemModel>} items
		 */
		setItems(items)
		{
			this.items = items;
		}

		play()
		{
			this.player?.play();
		}

		pause()
		{
			this.player?.pause();
		}

		stop()
		{
			this.player?.stop();
		}

		/**
		 * @abstract
		 */
		destructor()
		{}

		/**
		 * The list keeps file ids as they arrive from the store, so string and number
		 * ids mix: compare them as numbers, otherwise the item is silently not found.
		 *
		 * @param {string|number} fileId
		 * @returns {SidebarTabListItemModel|undefined}
		 */
		findItem(fileId)
		{
			return this.items.find((item) => Number(fileId) === Number(item?.data?.fileId));
		}

		/**
		 * @param {string|number} fileId
		 * @returns {number}
		 */
		findItemIndex(fileId)
		{
			return this.items.findIndex((item) => Number(fileId) === Number(item?.data?.fileId));
		}

		/**
		 * @param {string|number} fileId
		 * @returns {FilesModelState}
		 */
		getFileModel(fileId)
		{
			return this.store.getters['filesModel/getById'](fileId);
		}

		/**
		 * @returns {Array<SidebarTabListItemModel>}
		 */
		getItems()
		{
			return this.items;
		}

		/**
		 * @abstract
		 * @param {number} fileId
		 */
		onFinish(fileId)
		{}

		/**
		 * @param {SidebarAudioChangePayload} payload
		 */
		onChange(payload)
		{
			const { event, fileId } = payload;

			if (AudioEvents.finish === event)
			{
				this.onFinish(fileId);
			}

			this.emit('onChange', payload);
		}

		/**
		 * @abstract
		 * @param {Array<SidebarTabListItemModel>} items
		 */
		onViewableItemsChanged(items)
		{}

		/**
		 * @param {string} eventName
		 * @param {SidebarAudioChangePayload} payload
		 */
		emit(eventName, payload)
		{
			const handlers = this.listeners.get(eventName);

			if (!handlers || handlers.size === 0)
			{
				return;
			}

			handlers.forEach((handler) => {
				try
				{
					handler(payload);
				}
				catch (e)
				{
					logger.warn('listener error', e);
				}
			});
		}

		/**
		 * @param {string} eventName
		 * @param {function} handler
		 */
		on(eventName, handler)
		{
			if (!this.listeners.has(eventName))
			{
				this.listeners.set(eventName, new Set());
			}

			this.listeners.get(eventName).add(handler);
		}

		/**
		 * @param {string} eventName
		 * @param {function} handler
		 */
		off(eventName, handler)
		{
			const handlers = this.listeners.get(eventName);
			if (!handlers)
			{
				return;
			}

			handlers.delete(handler);

			if (handlers.size === 0)
			{
				this.listeners.delete(eventName);
			}
		}
	}

	module.exports = {
		BaseAudioPlayer,
	};
});
