/**
 * @module im/messenger/provider/pull/sticker-pack
 */
jn.define('im/messenger/provider/pull/sticker-pack', (require, exports, module) => {
	const { BasePullHandler } = require('im/messenger/provider/pull/base');

	/**
	 * @class StickerPackPullHandler
	 */
	class StickerPackPullHandler extends BasePullHandler
	{
		/**
		 * @param {{id: number, packId: StickerPackId, packType: StickerPackType,}} params
		 * @param extra
		 * @param command
		 */
		handleStickerRecentDelete(params, extra, command)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			const {
				id,
				packId,
				packType,
			} = params;

			this.store.dispatch('stickerPackModel/deleteRecentSticker', {
				stickerId: id,
				packId,
				packType,
			});
		}

		handleStickerRecentDeleteAll(params, extra, command)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			this.store.dispatch('stickerPackModel/deleteAllRecentStickers');
		}

		/**
		 * @param {{pack: StickerPackState, stickers: Array<StickerState>}} params
		 * @param extra
		 * @param command
		 */
		handleStickerPackAdd(params, extra, command)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			const { pack, stickers } = params;

			this.store.dispatch('stickerPackModel/createPack', {
				pack,
				stickers,
			});
		}

		handleStickerPackLink(params, extra, command)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			const { pack, stickers } = params;

			this.store.dispatch('stickerPackModel/linkPack', {
				pack,
				stickers,
			});
		}

		handleStickerPackDelete(params, extra, command)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			const { id, type } = params;

			this.store.dispatch('stickerPackModel/deletePack', {
				packId: id,
				packType: type,
			});
		}

		handleStickerPackUnlink(params, extra, command)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			const { id, type } = params;

			this.store.dispatch('stickerPackModel/unlinkPack', {
				packId: id,
				packType: type,
			});
		}

		handleStickerPackRename(params, extra, command)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			const { id, type, name } = params;

			this.store.dispatch('stickerPackModel/renamePack', {
				packId: id,
				packType: type,
				name,
			});
		}

		handleStickerAdd(params, extra, command)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			const { pack, stickers } = params;

			this.store.dispatch('stickerPackModel/addStickers', {
				stickers,
			});
		}

		handleStickerDelete(params, extra, command)
		{
			if (this.interceptEvent(extra))
			{
				return;
			}

			const {
				packId,
				packType,
				ids,
			} = params;

			this.store.dispatch('stickerPackModel/deleteStickers', {
				packId,
				packType,
				ids,
			});
		}
	}

	module.exports = { StickerPackPullHandler };
});
