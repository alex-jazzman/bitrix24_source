/**
 * @module im/messenger/controller/dialog/lib/sticker/src/ui/menu/attached-sticker-view
 */
jn.define('im/messenger/controller/dialog/lib/sticker/src/ui/menu/attached-sticker-view', (require, exports, module) => {
	const { Type } = require('type');
	const { SafeImage } = require('layout/ui/safe-image');

	const PREVIEW_SIZE = 272;

	/**
	 * @class StickerAttachedMenuView
	 */
	class StickerAttachedMenuView extends LayoutComponent
	{
		render()
		{
			const { uri } = this.props.stickerData;
			const { width, height } = this.#getPreviewSize();

			return View(
				{
					style: {
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				SafeImage({
					withShimmer: true,
					uri: Type.isStringFilled(uri) ? uri : '',
					style: {
						width,
						height,
					},
					resizeMode: 'contain',
					clickable: false,
				}),
			);
		}

		/**
		 * @return {{width: number, height: number}}
		 */
		#getPreviewSize()
		{
			const { width, height } = this.props.stickerData;

			const imageWidth = this.#validateSize(width);
			const imageHeight = this.#validateSize(height);

			if (!imageWidth || !imageHeight)
			{
				return {
					width: PREVIEW_SIZE,
					height: PREVIEW_SIZE,
				};
			}

			const scale = Math.min(PREVIEW_SIZE / imageWidth, PREVIEW_SIZE / imageHeight);
			const previewWidth = Math.max(1, Math.round(imageWidth * scale));
			const previewHeight = Math.max(1, Math.round(imageHeight * scale));

			return {
				width: previewWidth,
				height: previewHeight,
			};
		}

		/**
		 * @param {number|string} value
		 * @return {number|null}
		 */
		#validateSize(value)
		{
			const number = Number(value);

			if (!Type.isNumber(number) || number <= 0)
			{
				return null;
			}

			return number;
		}
	}

	module.exports = { StickerAttachedMenuView };
});
