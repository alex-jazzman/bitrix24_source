import { Core } from 'im.v2.application.core';

import type { ImModelStickerIdentifier, ImModelStickerPackIdentifier, ImModelStickerPack, ImModelSticker } from 'im.v2.model';

type StickerUuid = ImModelStickerIdentifier & { uuid: string };

export class StickersPullHandler
{
	constructor()
	{
		this.store = Core.getStore();
	}

	getModuleId(): string
	{
		return 'im';
	}

	handleStickerRecentDelete(params: ImModelStickerIdentifier)
	{
		const { id, packType, packId } = params;
		void Core.getStore().dispatch('stickers/recent/delete', { id, packType, packId });
	}

	handleStickerRecentDeleteAll()
	{
		void Core.getStore().dispatch('stickers/recent/clear');
	}

	handleStickerPackAdd(params: {pack: ImModelStickerPack, stickers: ImModelSticker[], uuids: StickerUuid[]})
	{
		const { pack, stickers } = params;
		void Core.getStore().dispatch('stickers/packs/set', [pack]);
		void Core.getStore().dispatch('stickers/set', stickers);
	}

	handleStickerPackLink(params: {pack: ImModelStickerPack, stickers: ImModelSticker[]})
	{
		this.handleStickerPackAdd(params);
	}

	handleStickerPackDelete(params: ImModelStickerPackIdentifier)
	{
		void Core.getStore().dispatch('stickers/packs/delete', params);
		void Core.getStore().dispatch('stickers/deleteByPack', params);
	}

	handleStickerPackUnlink(params: ImModelStickerPackIdentifier)
	{
		void Core.getStore().dispatch('stickers/packs/unlink', params);
	}

	handleStickerPackRename(params: ImModelStickerPackIdentifier & { name: string })
	{
		void Core.getStore().dispatch('stickers/packs/rename', params);
	}

	handleStickerAdd(params: {pack: ImModelStickerPack, stickers: ImModelSticker[]})
	{
		this.handleStickerPackAdd(params);
	}

	handleStickerDelete(params: {ids: number[], packType: string, packId: number})
	{
		void Core.getStore().dispatch('stickers/delete', params);
	}
}
