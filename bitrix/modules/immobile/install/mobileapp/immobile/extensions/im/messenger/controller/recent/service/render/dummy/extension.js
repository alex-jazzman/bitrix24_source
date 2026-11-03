/**
 * @module im/messenger/controller/recent/service/render/dummy
 */
jn.define('im/messenger/controller/recent/service/render/dummy', (require, exports, module) => {
	const { BaseRecentService } = require('im/messenger/controller/recent/service/base');

	/**
	 * @implements {IRenderService}
	 * @class DummyRenderService
	 */
	class DummyRenderService extends BaseRecentService
	{
		onInit()
		{
			this.logger.log('onInit');
		}

		hasItemRendered(id)
		{
			this.logger.log('hasItemRendered: return false');

			return false;
		}

		hasItemPending(id)
		{
			this.logger.log('hasItemPending: return false');

			return false;
		}

		beginCoalescingScope(scopeId)
		{
			this.logger.log(`beginCoalescingScope: scopeId = ${scopeId}`);
		}

		endCoalescingScope(scopeId)
		{
			this.logger.log(`endCoalescingScope: scopeId = ${scopeId}`);
		}

		isCoalescing()
		{
			this.logger.log('isCoalescing: return false');

			return false;
		}

		markCompositionChanged()
		{
			this.logger.log('markCompositionChanged');
		}

		setItems(itemList, options)
		{
			this.logger.log('setItems', itemList, options);
		}

		setPreparedItems(itemList, options)
		{
			this.logger.log('setPreparedItems', itemList, options);
		}

		deleteItems(itemList, options)
		{
			this.logger.log('deleteItems', itemList, options);
		}

		upsertItems(itemList, options)
		{
			this.logger.log('upsertItems', itemList, options);
		}

		upsertPreparedItems(itemList, options)
		{
			this.logger.log('upsertPreparedItems', itemList, options);
		}

		getSections()
		{
			this.logger.log('getSections: return empty array');

			return [];
		}

		showLoader(section)
		{
			this.logger.log(`showLoader: section = ${section}`);
		}

		hideLoader(section)
		{
			this.logger.log(`hideLoader: section = ${section}`);
		}

		renderInstant(options)
		{
			this.logger.log('renderInstant', options);
		}

		executeAfterRender(callback)
		{
			this.logger.log('executeAfterRender', callback);
		}

		getItemCollectionSize()
		{
			this.logger.log('getItemCollectionSize');

			return 0;
		}

		/**
		 * @return {RenderStats}
		 */
		getRenderStats()
		{
			this.logger.log('getRenderStats: return zeroes');

			return {
				setItemsToNative: 0,
				addItemsToNative: 0,
				updateItemsToNative: 0,
				removeFromNative: 0,
				queuePasses: 0,
				forcedPasses: 0,
				compositionForcedPasses: 0,
				scopeFinalPasses: 0,
				markedPasses: 0,
				skippedIdenticalSetItems: 0,
				compositionSignals: 0,
			};
		}

		resetRenderStats()
		{
			this.logger.log('resetRenderStats');
		}

		subscribeEvents()
		{
			this.logger.log('subscribeEvents');
		}

		unsubscribeEvents()
		{
			this.logger.log('unsubscribeEvents');
		}
	}

	module.exports = DummyRenderService;
});
