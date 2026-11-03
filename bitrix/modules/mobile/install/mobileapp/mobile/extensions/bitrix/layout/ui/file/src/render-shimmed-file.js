/**
 * @module layout/ui/file/src/render-shimmed-file
 */
jn.define('layout/ui/file/src/render-shimmed-file', (require, exports, module) => {
	const { Line } = require('utils/skeleton');
	const { Component, Indent } = require('tokens');

	/**
	 * @param {FileShimmerContentProps} props
	 * @return {View}
	 */
	function renderShimmedFile({ previewSize, textLines })
	{
		return View(
			{
				style: {
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
				},
			},
			Line(previewSize, previewSize, 0, 0, Component.elementSCorner.toNumber()),
			View(
				{
					style: {
						marginTop: Indent.XS2.toNumber(),
						width: 58,
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				...Array.from({ length: textLines }).fill(
					Line('100%', 8, 4),
				),
			),
		);
	}

	module.exports = { renderShimmedFile };
});
