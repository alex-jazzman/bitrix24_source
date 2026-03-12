export type Sticker = {
	id: number,
	packId: number,
	packType: string,
	type: 'image',
	uri: string,
	width: number,
	height: number,
	sort: number,
};

export type Pack = {
	id: number,
	key: string, // format: `${id}:${type}`
	type: string,
	name: string,
	authorId: number | null,
	isAdded: boolean,
};

export type RawPack = Omit<Pack, 'key'>;

export type RawSticker = Sticker;

export type StickerIdentifier = {
	id: number,
	packId: number,
	packType: string,
};

export type PackIdentifier = {
	id: number,
	type: string,
};

export type RawStickerMessage = {messageId: number | string } & StickerIdentifier
