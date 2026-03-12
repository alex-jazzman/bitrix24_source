import { Type } from 'main.core';

import { Core } from 'im.v2.application.core';
import { RestMethod } from 'im.v2.const';
import { runAction } from 'im.v2.lib.rest';
import { Logger } from 'im.v2.lib.logger';
import { Notifier } from 'im.v2.lib.notifier';

import type { ImModelStickerPackIdentifier, ImModelStickerIdentifier, ImModelStickerPack } from 'im.v2.model';
import type { RawSticker, RawStickerPack } from 'im.v2.provider.service.types';

type StickerPackLoadResponse = {
	packs: RawStickerPack[],
	stickers: RawSticker[],
	recentStickers?: RawSticker[],
	hasNextPage: boolean,
};

type CreatePackResponse = {
	pack: RawStickerPack[],
	stickers: RawSticker[],
	uuids: Array<{
		id: number,
		packId: number,
		packType: string,
		uuid: string,
	}>,
};

type AddStickersResponse = CreatePackResponse;

type LoadPackResponse = { pack: RawStickerPack, stickers: RawSticker[] };

const PACKS_REQUEST_LIMIT = 10;

export class StickerService
{
	static instance: StickerService;

	#lastPackId: number | null = null;
	#lastPackType: string = '';
	#hasMore: boolean = true;

	static getInstance(): StickerService
	{
		if (!this.instance)
		{
			this.instance = new this();
		}

		return this.instance;
	}

	async initFirstPage(): Promise
	{
		if (this.#lastPackId)
		{
			return Promise.resolve();
		}

		return this.#requestItems();
	}

	async loadNextPage(): Promise
	{
		if (!this.#hasMore)
		{
			return Promise.resolve();
		}

		return this.#requestItems();
	}

	async loadPack({ id, type }: ImModelStickerPackIdentifier): Promise
	{
		const hasPack = Core.getStore().getters['stickers/packs/hasPack']({ id, type });
		if (hasPack)
		{
			return Promise.resolve();
		}

		const rawData: LoadPackResponse = await runAction(RestMethod.imV2StickerPackGet, {
			data: { id, type },
		}).catch((error) => {
			Logger.warn('StickerService: pack request error', error);
		});

		const { pack, stickers } = rawData;

		const packsPromise = Core.getStore().dispatch('stickers/packs/set', [pack]);
		const stickersPromise = Core.getStore().dispatch('stickers/set', stickers);

		return Promise.all([stickersPromise, packsPromise]);
	}

	async linkPack({ id, type }: ImModelStickerPackIdentifier): Promise
	{
		void Core.getStore().dispatch('stickers/packs/link', { id, type });
		await runAction(RestMethod.imV2StickerPackLink, {
			data: { id, type },
		}).catch((errors) => {
			const [firstError] = errors;
			Notifier.sticker.handleLimits(firstError);
			Logger.warn('StickerService: link pack error', errors);
			Notifier.sticker.onLinkPackError();
		});
	}

	async createPack({ uuids, type, name }: { uuids: string[], type: string, name: string }): Promise
	{
		const rawData: CreatePackResponse = await runAction(RestMethod.imV2StickerPackAdd, {
			data: { uuids, type, name },
		}).catch((errors) => {
			const [firstError] = errors;
			Notifier.sticker.handleLimits(firstError);
			Logger.warn('StickerService: pack creation error', errors);
		});

		const { pack, stickers } = rawData;
		const packsPromise = Core.getStore().dispatch('stickers/packs/set', [pack]);
		const stickersPromise = Core.getStore().dispatch('stickers/set', stickers);

		return Promise.all([packsPromise, stickersPromise]);
	}

	async renamePack({ id, type, name }: ImModelStickerPackIdentifier & {name: string}): Promise
	{
		void Core.getStore().dispatch('stickers/packs/rename', { id, type, name });
		await runAction(RestMethod.imV2StickerPackRename, {
			data: { id, type, name },
		}).catch((error) => {
			Logger.warn('StickerService: rename pack error', error);
		});
	}

	async addStickers({ uuids, id, type }: { uuids: string[], id: number, type: string }): Promise
	{
		const rawData: AddStickersResponse = await runAction(RestMethod.imV2StickerAdd, {
			data: { uuids, packId: id, packType: type },
		}).catch((errors) => {
			const [firstError] = errors;
			Notifier.sticker.handleLimits(firstError);
			Logger.warn('StickerService: add stickers error', errors);
			throw errors;
		});

		const { pack, stickers } = rawData;
		const packsPromise = Core.getStore().dispatch('stickers/packs/set', [pack]);
		const stickersPromise = Core.getStore().dispatch('stickers/set', stickers);

		return Promise.all([packsPromise, stickersPromise]);
	}

	async updatePack({ uuids, id, type, name }: { uuids: string[], id: number, type: string, name: string }): Promise
	{
		const promises = [];
		if (Type.isArrayFilled(uuids))
		{
			promises.push(this.addStickers({ uuids, id, type }));
		}

		if (this.#wasPackRenamed({ id, type, name }))
		{
			promises.push(this.renamePack({ uuids, id, type, name }));
		}

		return Promise.all(promises);
	}

	async deletePack({ id, type }: ImModelStickerPackIdentifier): Promise
	{
		void Core.getStore().dispatch('stickers/packs/delete', { id, type });
		void Core.getStore().dispatch('stickers/deleteByPack', { id, type });
		await runAction(RestMethod.imV2StickerPackDelete, {
			data: { id, type },
		}).catch((error) => {
			Logger.warn('StickerService: delete pack error', error);
		});
	}

	async unlinkPack({ id, type }: ImModelStickerPackIdentifier): Promise
	{
		void Core.getStore().dispatch('stickers/packs/unlink', { id, type });

		await runAction(RestMethod.imV2StickerPackUnlink, {
			data: { id, type },
		}).catch((error) => {
			Logger.warn('StickerService: unlink pack error', error);
		});
	}

	async clearRecent(): Promise
	{
		void Core.getStore().dispatch('stickers/recent/clear');
		await runAction(RestMethod.imV2StickerRecentDeleteAll, { data: {} }).catch((error) => {
			Logger.warn('StickerService: clear recent error', error);
		});
	}

	async removeFromRecent({ id, packType, packId }: ImModelStickerIdentifier): Promise
	{
		void Core.getStore().dispatch('stickers/recent/delete', { id, packType, packId });

		await runAction(RestMethod.imV2StickerRecentDelete, {
			data: { id, packId, packType },
		}).catch((error) => {
			Logger.warn('StickerService: remove sticker from recent error', error);
		});
	}

	async deleteStickerFromPack({ ids, packId, packType }: { ids: number[], packId: number, packType: string }): Promise
	{
		void Core.getStore().dispatch('stickers/delete', { ids, packType, packId });
		const remainingStickers = Core.getStore().getters['stickers/getByPack']({ id: packId, type: packType });
		if (!Type.isArrayFilled(remainingStickers))
		{
			void Core.getStore().dispatch('stickers/packs/delete', { id: packId, type: packType });
		}

		await runAction(RestMethod.imV2StickerDelete, {
			data: { ids, packId, packType },
		}).catch((error) => {
			Logger.warn('StickerService: remove sticker from pack error', error);
		});
	}

	#getQueryParams(): { limit: number, id?: number, type?: string }
	{
		const params = { limit: PACKS_REQUEST_LIMIT };
		const isFirstPage = !this.#lastPackId && !this.#lastPackType;
		if (!isFirstPage)
		{
			params.id = this.#lastPackId;
			params.type = this.#lastPackType;
		}

		return params;
	}

	async #requestItems(): Promise<void>
	{
		const query = { data: this.#getQueryParams() };
		const isFirstPage = !this.#lastPackId && !this.#lastPackType;
		const method = isFirstPage ? RestMethod.imV2StickerPackLoad : RestMethod.imV2StickerPackTail;

		const rawData: StickerPackLoadResponse = await runAction(method, query).catch((error) => {
			Logger.warn('StickerService: page request error', error);
		});
		this.#handlePagination(rawData);
		this.#updateModels(rawData);
	}

	#handlePagination(response: StickerPackLoadResponse): void
	{
		this.#hasMore = response.hasNextPage;
		const lastPack = response.packs[response.packs.length - 1];
		if (lastPack)
		{
			this.#lastPackId = lastPack.id;
			this.#lastPackType = lastPack.type;
		}
	}

	#updateModels(response: StickerPackLoadResponse): void
	{
		const { packs, stickers, recentStickers = [] } = response;
		const packsPromise = Core.getStore().dispatch('stickers/packs/set', packs);
		const stickersPromise = Core.getStore().dispatch('stickers/set', stickers);
		const recentPromise = Core.getStore().dispatch('stickers/recent/set', recentStickers);

		return Promise.all([stickersPromise, packsPromise, recentPromise]);
	}

	#wasPackRenamed({ id, type, name }: ImModelStickerPackIdentifier & {name: string}): boolean
	{
		const pack: ?ImModelStickerPack = Core.getStore().getters['stickers/packs/getByIdentifier']({ id, type });
		if (!pack)
		{
			return false;
		}

		return pack.name !== name;
	}
}
