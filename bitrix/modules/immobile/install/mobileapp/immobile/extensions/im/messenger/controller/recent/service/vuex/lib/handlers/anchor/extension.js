/**
 * @module im/messenger/controller/recent/service/vuex/lib/handlers/anchor
 */
jn.define('im/messenger/controller/recent/service/vuex/lib/handlers/anchor', (require, exports, module) => {
	const { PerfPoint } = require('debug/prism');
	const { Type } = require('type');
	const { ROOT_PARENT_CHAT_ID } = require('im/messenger/const');
	const { serviceLocator } = require('im/messenger/lib/di/service-locator');
	const { FolderComposition } = require('im/messenger/controller/recent/service/lib/folder-composition');

	class AnchorMutationHandler
	{
		#hasCompositionRule = false;

		/**
		 * @param {RecentLocator} recentLocator
		 * @param {Logger} logger
		 * @param {{hasCompositionRule?: boolean}} [options] hasCompositionRule is set by a tab that
		 *   builds its list by a rule of its own instead of by the bucket of a single section
		 */
		constructor(recentLocator, logger, options = {})
		{
			/**
			 * @private
			 * @type {RecentLocator}
			 */
			this.recentLocator = recentLocator;
			/**
			 * @private
			 * @type {Logger}
			 */
			this.logger = logger;
			/**
			 * @private
			 * @type {MessengerCoreStore}
			 */
			this.store = serviceLocator.get('core').getStore();
			this.#hasCompositionRule = options.hasCompositionRule === true;
		}

		/**
		 * @param {MutationPayload<AnchorAddData>} payload
		 */
		addHandler = ({ payload }) => {
			const { anchor } = payload.data;

			this.#updateRecentItems([anchor]);
		};

		/**
		 * @param {MutationPayload<AnchorDeleteData>} payload
		 */
		deleteHandler = ({ payload }) => {
			const { anchor } = payload.data;

			this.#updateRecentItems([anchor]);
		};

		/**
		 * @param {MutationPayload<AnchorDeleteManyData>} payload
		 */
		deleteManyHandler = ({ payload }) => {
			const { anchorList } = payload.data;

			this.#updateRecentItems(anchorList);
		};

		/**
		 * @param {Array<AnchorModelState>} anchorList
		 */
		#updateRecentItems(anchorList)
		{
			if (!Type.isArrayFilled(anchorList))
			{
				return;
			}

			const tabId = this.recentLocator.get('id');
			const point = new PerfPoint('IM Recent Anchor Batch', tabId).start();

			try
			{
				point.startPoint('Process Anchors');

				const tabSections = this.recentLocator.get('vuex')?.sections
					?? FolderComposition.getSectionsByTabId(tabId)
				;
				const parentChatId = this.recentLocator.get('parentChatId');
				const parentChatIds = Type.isNumber(parentChatId) ? [parentChatId] : undefined;
				const filteredIdCollection = this.#getFilteredIdCollection(tabId, parentChatId);

				for (const anchor of anchorList)
				{
					this.#updateRecentItem(anchor, tabSections, parentChatIds, filteredIdCollection);
				}
			}
			finally
			{
				point.endPoint('Process Anchors', { anchorCount: anchorList.length });
				point.end();
			}
		}

		/**
		 * @param {AnchorModelState} anchor
		 * @param {Set<string>} tabSections
		 * @param {Array<number>|undefined} parentChatIds
		 * @param {?Set<string>} filteredIdCollection
		 */
		#updateRecentItem(anchor, tabSections, parentChatIds, filteredIdCollection)
		{
			if (!anchor.chatId)
			{
				return;
			}

			const recentItem = this.store.getters['recentModel/getByChatId'](anchor.chatId);

			if (!this.#hasItemInCurrentTab(recentItem?.id, tabSections, parentChatIds, filteredIdCollection))
			{
				return;
			}

			this.recentLocator.get('render').upsertItems([recentItem]);
		}

		/**
		 * An anchor event says nothing about the counters, so a row excluded by the selected filter
		 * must stay excluded: the render service does not check the filter itself. Read once per
		 * batch, like the sections of the tab.
		 * @param {string} tabId
		 * @param {number|undefined} parentChatId
		 * @return {?Set<string>} null when the tab shows every row
		 */
		#getFilteredIdCollection(tabId, parentChatId)
		{
			const realParentChatId = Type.isNumber(parentChatId) ? parentChatId : ROOT_PARENT_CHAT_ID;

			const hasSelectedFilter = this.store.getters['recentModel/recentFilteredModel/hasSelectedFilter'](
				tabId,
				realParentChatId,
			);
			if (!hasSelectedFilter)
			{
				return null;
			}

			return this.store.getters['recentModel/recentFilteredModel/getIdCollection'](tabId, realParentChatId);
		}

		/**
		 * @param {?string} dialogId
		 * @param {Set<string>} tabSections
		 * @param {Array<number>|undefined} parentChatIds
		 * @param {?Set<string>} filteredIdCollection
		 * @return {boolean}
		 */
		#hasItemInCurrentTab(dialogId, tabSections, parentChatIds, filteredIdCollection)
		{
			if (tabSections.size === 0)
			{
				return false;
			}

			if (filteredIdCollection && !filteredIdCollection.has(dialogId))
			{
				return false;
			}

			const sections = this.store.getters['recentModel/getSectionsContainingItem'](dialogId, parentChatIds);
			if (!this.#hasCompositionRule)
			{
				return sections.some(({ recentSection }) => tabSections.has(recentSection));
			}

			// A bucket key is not enough for a tab with a composition rule of its own: sections with
			// top-level propagation keep nested chats in the root bucket, and the rule rejects them.
			const dialog = this.store.getters['dialoguesModel/getById'](dialogId);
			const realParentChatId = dialog?.parentChatId ?? ROOT_PARENT_CHAT_ID;

			return sections.some(({ parentChatId, recentSection }) => {
				return parentChatId === realParentChatId && tabSections.has(recentSection);
			});
		}
	}

	module.exports = { AnchorMutationHandler };
});
