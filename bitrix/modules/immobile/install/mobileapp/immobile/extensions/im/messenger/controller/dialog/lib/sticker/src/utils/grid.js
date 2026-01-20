/**
 * @module im/messenger/controller/dialog/lib/sticker/src/utils/grid
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/utils/grid', (require, exports, module) => {

	/**
	 * @class GridUtils
	 */
	class GridUtils
	{
		static calculateRowSize(deviceWidth)
		{
			const stickerWidth = 82;
			const stickerWithGap = stickerWidth + 4;
			const contentArea = deviceWidth - 36;

			if (contentArea < stickerWidth)
			{
				return 0;
			}

			const remainingSpace = contentArea - stickerWidth;

			if (remainingSpace < 4)
			{
				return 1;
			}

			return 1 + Math.floor(remainingSpace / stickerWithGap);
		}

		static createHeaderKey(packType, packId)
		{
			return `header-${packType}:${packId}`;
		}

		static createRecentHeaderKey()
		{
			return 'header-recent';
		}

		static createStickersKey(keyPrefix, rowCount)
		{
			return `${keyPrefix}-${rowCount}`;
		}

		static createStickersKeyPrefix(packType, packId)
		{
			return `stickers-${packType}:${packId}`;
		}

		static createRecentStickersKeyPrefix()
		{
			return 'recentStickers';
		}
	}

	module.exports = { GridUtils };
});
