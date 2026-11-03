/**
 * @module layout/ui/file/src/render-image
 */
jn.define('layout/ui/file/src/render-image', (require, exports, module) => {
	const { SafeImage } = require('layout/ui/safe-image');
	const { Component } = require('tokens');
	const { renderOutline, renderLoadingOverlay, renderLabel } = require('layout/ui/file/src/tile-parts');

	/**
	 * @param {FileImageContentProps} props
	 * @return {View}
	 */
	function renderImage({ imageUri, name, previewSize, isLoading, hasError, textLines })
	{
		return View(
			{
				style: {
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
				},
			},
			View(
				{
					style: {
						width: previewSize,
						height: previewSize,
					},
				},
				SafeImage({
					testId: 'pinnedFileImage',
					withShimmer: true,
					style: {
						width: previewSize,
						height: previewSize,
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: Component.elementSCorner.toNumber(),
					},
					uri: imageUri,
					resizeMode: 'cover',
					clickable: false,
				}),
				isLoading && renderLoadingOverlay(previewSize),
				renderOutline(hasError),
			),
			name && renderLabel({
				name,
				hasError,
				textLines,
				// android wraps a multiline name, so the cut goes to the end instead of the middle
				ellipsize: (Application.getPlatform() === 'android' && textLines > 1) ? 'end' : 'middle',
			}),
		);
	}

	module.exports = { renderImage };
});
