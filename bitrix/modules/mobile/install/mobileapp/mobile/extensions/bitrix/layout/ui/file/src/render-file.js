/**
 * @module layout/ui/file/src/render-file
 */
jn.define('layout/ui/file/src/render-file', (require, exports, module) => {
	const { IconView } = require('ui-system/blocks/icon');
	const { renderOutline, renderLoadingOverlay, renderLabel } = require('layout/ui/file/src/tile-parts');

	/**
	 * @param {FileIconContentProps} props
	 * @return {View}
	 */
	function renderFile({ icon, name, previewSize, isLoading, hasError, textLines })
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
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				IconView({
					icon,
					color: null,
					testId: 'pinnedFileIcon',
					size: previewSize / 2,
				}),
				isLoading && renderLoadingOverlay(previewSize),
				renderOutline(hasError),
			),
			renderLabel({
				name,
				hasError,
				textLines,
				ellipsize: Application.getPlatform() === 'android' ? 'end' : 'middle',
			}),
		);
	}

	module.exports = { renderFile };
});
