// Raster formats the backend accepts as an image (Manager::savePicture →
// CFile::checkImageFile with the IMAGE filter). SVG is intentionally excluded:
// it is gated behind the allow_svg_content module option because it can carry
// scripts and event handlers (XSS on inline render).
export const RASTER_IMAGE_ACCEPT = 'image/png,image/jpeg,image/gif,image/webp';

/**
 * Builds the file input `accept` value for the upload picker from the editor
 * `allow_svg` option. When SVG is disabled on the backend, the picker must not
 * offer it (browsers include image/svg+xml in image/*), otherwise the chosen
 * SVG would be rejected server-side with FILE_ERROR.
 * @param {boolean} allowSvg
 * @return {string}
 */
export function buildAcceptValue(allowSvg): string
{
	return allowSvg ? 'image/*' : RASTER_IMAGE_ACCEPT;
}
