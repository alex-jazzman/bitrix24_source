import { Store } from 'ui.vue3.vuex';

import { Core } from 'im.v2.application.core';

import type { RawSticker, RawStickerPack } from 'im.v2.provider.service.types';

export class StickerManager
{
	static instance: StickerManager;
	#store: Store;

	constructor()
	{
		this.#store = Core.getStore();
	}

	addStickersFromService(packs: RawStickerPack[], recent: RawSticker[]): Promise<void>
	{
		const packsPromise = this.#store.dispatch('messages/stickers/setPacks', packs);
		const recentPromise = this.#store.dispatch('messages/stickers/setRecentStickers', recent);

		return Promise.all([packsPromise, recentPromise]);
	}

	makeStickerKey(id: number, packId: number, packType: string): string
	{
		return `${packId}:${packType}:${id}`;
	}

	makePackKey(packId: number, packType: string): string
	{
		return `${packId}:${packType}`;
	}

	parseStickerKey(key: string): { id: string, packId: string, packType: string }
	{
		const [packId, packType, id] = key.split(':');

		return { id, packId, packType };
	}
}
