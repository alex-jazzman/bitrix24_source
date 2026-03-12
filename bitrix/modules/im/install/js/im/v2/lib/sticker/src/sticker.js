import { Loc } from 'main.core';

import type { ImModelStickerPack, ImModelStickerPackIdentifier } from 'im.v2.model';

export const RecentPackId = 0;
export const RecentPackType = 'recent';

export const StickerManager = {
	getRecentPack(): ImModelStickerPack
	{
		return {
			id: RecentPackId,
			key: `${RecentPackId}:${RecentPackType}`,
			type: RecentPackType,
			name: Loc.getMessage('IM_LIB_STICKER_PACK_RECENT'),
			authorId: null,
		};
	},
	isRecentPack(pack: ImModelStickerPackIdentifier): boolean
	{
		return pack.id === RecentPackId && pack.type === RecentPackType;
	},
};
