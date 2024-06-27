/**
 * @module text-editor/adapters/disk-adapter
 */
jn.define('text-editor/adapters/disk-adapter', (require, exports, module) => {
	const { BaseAdapter } = require('text-editor/adapters/base-adapter');
	const { ImageAdapter } = require('text-editor/adapters/image-adapter');
	const { scheme } = require('text-editor/internal/scheme');
	const { Type } = require('type');

	/**
	 * @param options {{
	 *     node: ElementNode,
	 *     fileOptions: {
	 *     		id: number,
	 *     		url: string,
	 *     		width: number,
	 *     		height: number,
	 *     		isImage: boolean,
	 *     },
	 * }}
	 */
	class DiskAdapter extends BaseAdapter
	{
		/**
		 * Gets preview element
		 * @returns {ElementNode}
		 */
		getPreview()
		{
			if (!this.previewSync)
			{
				const { fileOptions: file } = this.getOptions();
				if (
					file?.type?.startsWith?.('image')
					&& Type.isNumber(file?.width)
					&& Type.isNumber(file?.height)
				)
				{
					const { width, height } = ImageAdapter.resizeImageToFit({
						imageWidth: file.width,
						imageHeight: file.height,
						maxWidth: 300,
						maxHeight: 180,
					});

					this.previewSync = scheme.createElement({
						name: 'img',
						attributes: {
							width,
							height,
						},
						children: [
							scheme.createText({
								content: `${currentDomain}${file.url}`,
							}),
						],
					});
				}
				else
				{
					this.previewSync = scheme.createElement({
						name: 'url',
						value: `${currentDomain}${file.url}`,
						children: [
							scheme.createText({
								content: file.name,
							}),
						],
					});
				}
			}

			return this.previewSync;
		}
	}

	module.exports = {
		DiskAdapter,
	};
});
