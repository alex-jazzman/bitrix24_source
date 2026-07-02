import { type Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';

import { QuickReplyService, type RawQuickReply, type QuickReplyLoadListResult, type QuickReplySaveFormData } from 'imopenlines.v2.provider.service';

export const ALL_SECTIONS_ID = 0;
export const PAGE_SIZE = 50;
export const MIN_QUERY_LENGTH_FOR_SERVER_SEARCH = 3;

export class QuickReplyManager
{
	#quickReplyService: QuickReplyService;
	#store: Store;
	#offset: number = 0;
	#searchQuery: string = '';
	#sectionId: number = ALL_SECTIONS_ID;
	#isLoadingNextPage: boolean = false;
	#loadedDialogId: string | null = null;

	static #instance: QuickReplyManager | null = null;

	static getInstance(): QuickReplyManager
	{
		if (!QuickReplyManager.#instance)
		{
			QuickReplyManager.#instance = new QuickReplyManager(Core.getStore(), new QuickReplyService());
		}

		return QuickReplyManager.#instance;
	}

	constructor(store: Store, quickReplyService: QuickReplyService)
	{
		this.#quickReplyService = quickReplyService;
		this.#store = store;
	}

	#getLineId(dialogId: string): number
	{
		const connector = this.#store.getters['openLines/connector/getByDialogId'](dialogId);

		return connector?.lineId ?? 0;
	}

	hasStaleCache(dialogId: string): boolean
	{
		return this.#loadedDialogId !== dialogId;
	}

	async loadList(dialogId: string, params: {
		searchQuery?: string,
		sectionId?: number,
	} = {}): Promise<QuickReplyLoadListResult>
	{
		if (this.hasStaleCache(dialogId))
		{
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
			limit: PAGE_SIZE,
		});
		await this.#processResult(result, currentSearch, currentSectionId);

		return result;
	}

	async #resetStateAndStore(dialogId: string): Promise<void>
	{
		this.#offset = 0;
		this.#searchQuery = '';
		this.#sectionId = ALL_SECTIONS_ID;
		this.#loadedDialogId = dialogId;
		await this.#store.dispatch('openLines/quickReply/clear');
	}

	async loadNextPage(dialogId: string): Promise<void>
	{
		if (this.#isLoadingNextPage)
		{
			return;
		}

		this.#isLoadingNextPage = true;
		try
		{
			const lineId = this.#getLineId(dialogId);
			const search = this.#searchQuery;
			const sectionId = this.#sectionId;
			const offset = this.#offset;
			const result = await this.#quickReplyService.loadList({
				lineId,
				search,
				sectionId,
				offset,
				limit: PAGE_SIZE,
			});
			await this.#processResult(result, search, sectionId, true);
		}
		finally
		{
			this.#isLoadingNextPage = false;
		}
	}

	async search(dialogId: string, rawQuery: string): Promise<void>
	{
		const queryForServer = rawQuery.length >= MIN_QUERY_LENGTH_FOR_SERVER_SEARCH ? rawQuery : '';
		if (queryForServer === this.#searchQuery)
		{
			return;
		}
		await this.loadList(dialogId, { searchQuery: queryForServer });
	}

	async save(dialogId: string, data: QuickReplySaveFormData): Promise<?RawQuickReply>
	{
		const lineId = this.#getLineId(dialogId);
		const savedReply = await this.#quickReplyService.save({
			lineId,
			id: data.id || 0,
			text: data.text,
			sectionId: data.sectionId || ALL_SECTIONS_ID,
		});

		if (savedReply)
		{
			await this.#store.dispatch('openLines/quickReply/update', savedReply);
		}

		return savedReply;
	}

	selectReply(dialogId: string, reply: RawQuickReply): void
	{
		const lineId = this.#getLineId(dialogId);
		void this.#quickReplyService.incrementRating({ id: reply.id, lineId });
		void this.#store.dispatch('openLines/quickReply/update', {
			...reply,
			rating: reply.rating + 1,
		});
	}

	async #processResult(
		result: QuickReplyLoadListResult,
		search: string,
		sectionId: number,
		append: boolean = false,
	): Promise<void>
	{
		if (this.#isOutdated(search, sectionId))
		{
			return;
		}

		const {
			replies,
			totalCount,
			sections,
			manageUrl,
			permissions,
		} = result;
		this.#offset = append ? this.#offset + PAGE_SIZE : PAGE_SIZE;
		const hasNextPage = this.#offset < totalCount;
		await this.#store.dispatch('openLines/quickReply/set', {
			replies,
			hasNextPage,
			sections,
			manageUrl,
			permissions,
		});
	}

	#isOutdated(search: string, sectionId: number): boolean
	{
		return search !== this.#searchQuery || sectionId !== this.#sectionId;
	}
}
