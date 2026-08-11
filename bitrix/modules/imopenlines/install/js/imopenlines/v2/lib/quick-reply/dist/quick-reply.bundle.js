/* eslint-disable */
this.BX = this.BX || {};
this.BX.OpenLines = this.BX.OpenLines || {};
this.BX.OpenLines.v2 = this.BX.OpenLines.v2 || {};
(function (exports, im_v2_application_core, imopenlines_v2_provider_service) {
	'use strict';

	const ALL_SECTIONS_ID = 0;
	const PAGE_SIZE = 50;
	const MIN_QUERY_LENGTH_FOR_SERVER_SEARCH = 3;
	class QuickReplyManager {
		#quickReplyService;
		#store;
		#offset = 0;
		#searchQuery = '';
		#sectionId = ALL_SECTIONS_ID;
		#isLoadingNextPage = false;
		#loadedDialogId = null;
		#loadedLineId = null;
		static #instance = null;
		static getInstance() {
			if (!QuickReplyManager.#instance) {
				QuickReplyManager.#instance = new QuickReplyManager(im_v2_application_core.Core.getStore(), new imopenlines_v2_provider_service.QuickReplyService());
			}
			return QuickReplyManager.#instance;
		}
		constructor(store, quickReplyService) {
			this.#quickReplyService = quickReplyService;
			this.#store = store;
		}
		#getLineId(dialogId) {
			const chatId = this.#store.getters['chats/get'](dialogId, true).chatId;
			const session = this.#store.getters['openLines/sessions/getByChatId'](chatId);
			const connector = this.#store.getters['openLines/connector/getByDialogId'](dialogId);
			return session?.queueId ?? connector?.lineId ?? 0;
		}
		hasStaleCache(dialogId) {
			return this.#loadedDialogId !== dialogId || this.#loadedLineId !== this.#getLineId(dialogId);
		}
		async loadList(dialogId, params = {}) {
			if (this.hasStaleCache(dialogId)) {
				await this.#resetStateAndStore(dialogId);
			}
			const lineId = this.#getLineId(dialogId);
			this.#searchQuery = params.searchQuery ?? this.#searchQuery;
			this.#sectionId = params.sectionId ?? this.#sectionId;
			this.#offset = 0;
			const currentSearch = this.#searchQuery;
			const currentSectionId = this.#sectionId;
			const result = await this.#quickReplyService.loadList({
				lineId,
				search: currentSearch,
				sectionId: currentSectionId,
				offset: this.#offset,
				limit: PAGE_SIZE
			});
			await this.#processResult(result, currentSearch, currentSectionId);
			return result;
		}
		async #resetStateAndStore(dialogId) {
			this.#offset = 0;
			this.#searchQuery = '';
			this.#sectionId = ALL_SECTIONS_ID;
			this.#loadedDialogId = dialogId;
			this.#loadedLineId = this.#getLineId(dialogId);
			await this.#store.dispatch('openLines/quickReply/clear');
		}
		async loadNextPage(dialogId) {
			if (this.#isLoadingNextPage) {
				return;
			}
			this.#isLoadingNextPage = true;
			try {
				const lineId = this.#getLineId(dialogId);
				const search = this.#searchQuery;
				const sectionId = this.#sectionId;
				const offset = this.#offset;
				const result = await this.#quickReplyService.loadList({
					lineId,
					search,
					sectionId,
					offset,
					limit: PAGE_SIZE
				});
				await this.#processResult(result, search, sectionId, true);
			} finally {
				this.#isLoadingNextPage = false;
			}
		}
		async search(dialogId, rawQuery) {
			const queryForServer = rawQuery.length >= MIN_QUERY_LENGTH_FOR_SERVER_SEARCH ? rawQuery : '';
			if (queryForServer === this.#searchQuery) {
				return;
			}
			await this.loadList(dialogId, {
				searchQuery: queryForServer
			});
		}
		async save(dialogId, data) {
			const lineId = this.#getLineId(dialogId);
			const savedReply = await this.#quickReplyService.save({
				lineId,
				id: data.id || 0,
				text: data.text,
				sectionId: data.sectionId || ALL_SECTIONS_ID
			});
			if (savedReply) {
				await this.#store.dispatch('openLines/quickReply/update', savedReply);
			}
			return savedReply;
		}
		resetCache(dialogId) {
			if (this.#loadedDialogId === dialogId) {
				this.#loadedDialogId = null;
				this.#loadedLineId = null;
			}
		}
		selectReply(dialogId, reply) {
			const lineId = this.#getLineId(dialogId);
			void this.#quickReplyService.incrementRating({
				id: reply.id,
				lineId
			});
			void this.#store.dispatch('openLines/quickReply/update', {
				...reply,
				rating: reply.rating + 1
			});
		}
		async #processResult(result, search, sectionId, append = false) {
			if (this.#isOutdated(search, sectionId)) {
				return;
			}
			const {
				replies,
				totalCount,
				sections,
				manageUrl,
				permissions
			} = result;
			this.#offset = append ? this.#offset + PAGE_SIZE : PAGE_SIZE;
			const hasNextPage = this.#offset < totalCount;
			await this.#store.dispatch('openLines/quickReply/set', {
				replies,
				hasNextPage,
				sections,
				manageUrl,
				permissions
			});
		}
		#isOutdated(search, sectionId) {
			return search !== this.#searchQuery || sectionId !== this.#sectionId;
		}
	}

	exports.ALL_SECTIONS_ID = ALL_SECTIONS_ID;
	exports.MIN_QUERY_LENGTH_FOR_SERVER_SEARCH = MIN_QUERY_LENGTH_FOR_SERVER_SEARCH;
	exports.PAGE_SIZE = PAGE_SIZE;
	exports.QuickReplyManager = QuickReplyManager;

})(this.BX.OpenLines.v2.Lib = this.BX.OpenLines.v2.Lib || {}, BX.Messenger.v2.Application, BX.OpenLines.v2.Provider.Service);
//# sourceMappingURL=quick-reply.bundle.js.map
