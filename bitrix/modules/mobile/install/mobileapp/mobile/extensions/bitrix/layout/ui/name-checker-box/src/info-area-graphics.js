/**
 * @module layout/ui/name-checker-box/src/info-area-graphics
 */
jn.define('layout/ui/name-checker-box/src/info-area-graphics', (require, exports, module) => {
	const NameCheckerImageType = Object.freeze({
		SVG: 'svg',
		RASTER: 'raster',
	});

	function isRasterInfoAreaGraphics(type)
	{
		return type === NameCheckerImageType.RASTER;
	}

	module.exports = { NameCheckerImageType, isRasterInfoAreaGraphics };
});
