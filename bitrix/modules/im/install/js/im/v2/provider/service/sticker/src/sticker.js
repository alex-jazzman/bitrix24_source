import { RestMethod } from 'im.v2.const';
import { StickerManager } from 'im.v2.lib.sticker-manager';
import { runAction } from 'im.v2.lib.rest';
import { Logger } from 'im.v2.lib.logger';

import type { RawSticker, RawStickerPack } from 'im.v2.provider.service.types';

type ResponseData = { packs: RawStickerPack[], recentStickers: RawSticker[] };

export class StickerService
{
	#itemsPerPage: number = 10;
	#lastPackId: number | null = null;
	#lastPackType: string = '';
	#hasMore: boolean = true;
	#isLoading: boolean = false;

	static instance = null;

	static getInstance(): StickerService
	{
		if (!this.instance)
		{
			this.instance = new this();
		}

		return this.instance;
	}

	async initFirstPage(): Promise<void>
	{
		if (this.#isLoading || this.#lastPackId)
		{
			return Promise.resolve();
		}

		this.#isLoading = true;

		return this.#requestItems(true).finally(() => {
			this.#isLoading = false;
		});
	}

	async loadNextPage(): Promise<void>
	{
		if (this.#isLoading || !this.#hasMore)
		{
			return Promise.resolve();
		}

		this.#isLoading = true;

		return this.#requestItems()
			.catch((error) => {
				Logger.warn('StickerService: page request error', error);
			})
			.finally(() => {
				this.#isLoading = false;
			});
	}

	#getRestMethodName(firstPage: boolean = false): string
	{
		return firstPage ? RestMethod.imV2StickerPackLoad : RestMethod.imV2StickerPackTail;
	}

	#getQueryParams(firstPage: boolean = false): { limit: number, lastPackId?: number | null, lastPackType?: string }
	{
		const params = { limit: this.#itemsPerPage };
		if (!firstPage)
		{
			params.lastPackId = this.#lastPackId;
			params.lastPackType = this.#lastPackType;
		}

		return params;
	}

	async #requestItems(firstPage: boolean = false): Promise<void>
	{
		const query = { data: this.#getQueryParams(firstPage) };
		const method = this.#getRestMethodName(firstPage);

		const rawData: ResponseData = await runAction(method, query)
			.catch((error) => {
				Logger.warn('StickerService: page request error', error);
			});
		this.#handlePagination(rawData);
		await this.#updateModels(rawData);
	}

	async #updateModels({ packs, recentStickers }: ResponseData): Promise<void>
	{
		void (new StickerManager()).addStickersFromService(packs, recentStickers);
	}

	#handlePagination({ packs }: ResponseData): void
	{
		this.#hasMore = packs.length === this.#itemsPerPage;
		const lastPack = packs[packs.length - 1];
		if (lastPack)
		{
			this.#lastPackId = lastPack.id;
			this.#lastPackType = lastPack.type;
		}
	}
}
