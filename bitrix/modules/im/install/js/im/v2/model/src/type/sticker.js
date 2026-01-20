type StickerType = 'image';

export type Sticker = {
	uri: string,
	type: StickerType,
};

export type StickerPack = {
	name: string,
	stickers: string[],
};
