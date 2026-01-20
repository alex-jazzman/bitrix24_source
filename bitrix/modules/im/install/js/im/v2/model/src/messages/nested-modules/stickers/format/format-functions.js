import { StickerManager } from 'im.v2.lib.sticker-manager';

import type { JsonObject } from 'main.core';
import type { RawSticker, RawStickerPack } from 'im.v2.provider.service.types';

export const getStickersKeys = (target: RawSticker[], currentResult: JsonObject, rawFields: RawStickerPack) => {
	const { id, type } = rawFields;
	const stickers = [];
	target.forEach((sticker) => {
		const key = (new StickerManager()).makeStickerKey(sticker.id, id, type);
		stickers.push(key);
	});

	return stickers;
};

export const preparePackKey = (target: number, currentResult: JsonObject, rawFields: RawStickerPack) => {
	const { id, type } = rawFields;

	return (new StickerManager()).makePackKey(id, type);
};

export const prepareStickerKey = (target: number, currentResult: JsonObject, rawFields: RawSticker) => {
	const { id, packId, packType } = rawFields;

	return (new StickerManager()).makeStickerKey(id, packId, packType);
};
