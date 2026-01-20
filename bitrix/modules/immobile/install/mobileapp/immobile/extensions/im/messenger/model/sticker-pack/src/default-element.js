/**
 * @module im/messenger/model/sticker-pack/default-element
 */
jn.define('im/messenger/model/sticker-pack/default-element', (require, exports, module) => {

	/**
	 * @type {StickerState}
	 */
	const stickerDefaultElement = {
		id: 0,
		uri: null,
		width: 0,
		height: 0,
		type: 'image',
	};

	/**
	 * @type {StickerPackModelState}
	 */
	const packDefaultElement = {
		id: 0,
		stickers: [],
		type: 'vendor',
		name: '',
	};

	/**
	 * @type {FullStickerData}
	 */
	const recentStickerDefaultElement = {
		id: 0,
		packId: 0,
		packType: 'vendor',
		width: 0,
		height: 0,
		type: 'image',
		uri: null,
	};

	module.exports = {
		stickerDefaultElement,
		packDefaultElement,
		recentStickerDefaultElement,
	};
});
