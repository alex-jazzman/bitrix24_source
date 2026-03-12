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
		packId: 0,
		packType: 'vendor',
		sort: 0,
	};

	/**
	 * @type {StickerPackState}
	 */
	const packDefaultElement = {
		id: 0,
		name: '',
		type: 'vendor',
		authorId: null,
		isAdded: false,
	};

	/**
	 * @type {RecentStickerState}
	 */
	const recentStickerDefaultElement = {
		id: 0,
		packId: 0,
		packType: 'vendor',
	};

	module.exports = {
		stickerDefaultElement,
		packDefaultElement,
		recentStickerDefaultElement,
	};
});
