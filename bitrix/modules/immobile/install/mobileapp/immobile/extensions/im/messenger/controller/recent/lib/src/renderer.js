/* eslint-disable flowtype/require-return-type */

/**
 * @module im/messenger/controller/recent/lib/renderer
 */
jn.define('im/messenger/controller/recent/lib/renderer', (require, exports, module) => {
	const { Type } = require('type');
	const { isEqual } = require('utils/object');

	const { RecentUiConverter } = require('im/messenger/lib/converter/ui/recent');
	const { Worker } = require('im/messenger/lib/helper/worker');
	const { getLogger } = require('im/messenger/lib/logger');
	const logger = getLogger('recent--renderer');

	/**
	 * @class RecentRenderer
	 *
	 * Designed to reduce the number of redrawing for RecentView (dialogList).
	 * Collects items to add and modify in update queue and applies at a time.
	 */
	class RecentRenderer
	{
		/**
		 * @param {Object} options
		 * @param {RecentView} options.view
		 */
		constructor(options = {})
		{
			this.ACTION_ADD = 'add';
			this.ACTION_UPDATE = 'update';

			/** @private */
			this.view = options.view;

			/** @private */
			this.updateQueue = {};
			this.resetQueue();

			/** @private */
			this.nextTickCallbackList = [];

			/** @private */
			this.updateWorker = new Worker({
				frequency: 1000,
				callback: this.render.bind(this),
			});

			this.updateWorker.start();
		}

		resetQueue()
		{
			this.getSupportedActions().forEach((actionId) => {
				this.updateQueue[actionId] = {};
			});
		}

		do(action, items)
		{
			if (!this.isActionSupported(action))
			{
				logger.error('RecentRenderer: Unsupported action', action);

				return false;
			}

			items.forEach((item) => {
				this.updateQueue[action][item.id] = item;
			});

			return true;
		}

		add(itemList)
		{
			this.view.addItems(RecentUiConverter.toList(itemList));

			return true;
		}

		update(itemList)
		{
			const viewItemList = this.#prepareViewItemList(itemList);

			if (viewItemList.length > 0)
			{
				this.view.updateItems(viewItemList);

				return true;
			}

			return false;
		}

		removeFromQueue(itemId)
		{
			this.getSupportedActions().forEach((actionId) => {
				delete this.updateQueue[actionId][itemId];
			});
		}

		render()
		{
			const renderStart = Date.now();
			let isViewChanged = false;

			Object.keys(this.updateQueue).forEach((action) => {
				const itemList = [];

				Object.keys(this.updateQueue[action]).forEach((itemId) => {
					itemList.push(this.updateQueue[action][itemId]);

					delete this.updateQueue[action][itemId];
				});

				if (itemList.length > 0)
				{
					const result = this[action](itemList);
					// TODO if isViewChanged was true at least once, then we do not change it to false
					isViewChanged = isViewChanged || result;

					if (Type.isBoolean(result) && result === false)
					{
						logger.info(`RecentRenderer.${action} is canceled, the exact same element already exists`);
					}
					else
					{
						logger.info(`RecentRenderer.${action} items:`, itemList);
					}
				}
			});

			if (isViewChanged)
			{
				this.nextTickCallbackList.forEach((callback) => callback());
				this.nextTickCallbackList = [];

				const renderFinish = Date.now();

				logger.info('RecentRenderer.render time:', `${renderFinish - renderStart}ms.`);
			}
		}

		nextTick(callback)
		{
			if (!Type.isFunction(callback))
			{
				throw new TypeError('RecentRenderer.nextTick: callback must be a function');
			}

			this.nextTickCallbackList.push(callback);
		}

		/**
		 * @private
		 */
		getSupportedActions()
		{
			return new Set([
				this.ACTION_ADD,
				this.ACTION_UPDATE,
			]);
		}

		/**
		 * @private
		 */
		isActionSupported(action)
		{
			return this.getSupportedActions().has(action);
		}

		/**
		 * @param {RecentModelState[]} itemList
		 * @returns {{filter: {id: string}, element: RecentItem}[]}
		 */
		#prepareViewItemList(itemList)
		{
			return RecentUiConverter
				.toList(itemList)
				.map((item) => ({
					filter: { id: item.id.toString() },
					element: item,
				}))
				.filter((item) => !this.#hasEqualItemInRecent(item.element));
		}

		/**
		 * @param {RecentItem} item
		 * @returns {boolean}
		 */
		#hasEqualItemInRecent(item)
		{
			const viewItem = this.view.getItem(item?.id.toString());

			return viewItem && isEqual(viewItem, item);
		}
	}

	module.exports = {
		RecentRenderer,
	};
});
