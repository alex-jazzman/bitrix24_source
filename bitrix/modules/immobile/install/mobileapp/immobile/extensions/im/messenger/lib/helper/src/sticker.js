/**
 * @module im/messenger/lib/helper/sticker
 */
jn.define('im/messenger/lib/helper/sticker', (require, exports, module) => {

	/**
	 * @class StickerHelper
	 */
	class StickerHelper
	{
		/**
		 * @param {number} originalWidth
		 * @param {number} originalHeight
		 * @return {{width: number, height: number}}
		 */
		static calculateResizedDimensionsToMessage(originalWidth, originalHeight) {
			const maxSize = 142;

			if (originalWidth <= maxSize && originalHeight <= maxSize)
			{
				return {
					width: originalWidth,
					height: originalHeight,
				};
			}

			const widthRatio = maxSize / originalWidth;
			const heightRatio = maxSize / originalHeight;

			const scaleRatio = Math.min(widthRatio, heightRatio);

			const newWidth = Math.round(originalWidth * scaleRatio);
			const newHeight = Math.round(originalHeight * scaleRatio);

			return {
				width: newWidth,
				height: newHeight,
			};
		}

		/**
		 * @param {{uri: string, width: number, height: number}} stickerParams
		 */
		static createImgBBCode(stickerParams)
		{
			const {
				width,
				height,
			} = StickerHelper.calculateResizedDimensionsToMessage(stickerParams.width, stickerParams.height);

			return `[img width=${width} height=${height}]${stickerParams.uri}[/img]`;
		}
	}

	module.exports = { StickerHelper };
});
