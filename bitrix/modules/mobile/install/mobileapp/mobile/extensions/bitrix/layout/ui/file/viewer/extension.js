/**
 * @module layout/ui/file/viewer
 */
jn.define('layout/ui/file/viewer', (require, exports, module) => {
	const { throttle } = require('utils/function');
	const {
		getAbsolutePath,
		getNativeViewerMediaType,
		getMimeType,
		openNativeViewer,
		NativeViewerMediaTypes,
		mimeTypes,
	} = require('utils/file');
	const { requireLazy } = require('require-lazy');

	const throttledNativeViewer = throttle(async (params) => {
		const { file } = params;

		if (file?.type === mimeTypes.board)
		{
			try
			{
				const opener = await requireLazy('disk:opener/board');
				if (opener)
				{
					const { boardOpener } = opener;

					return boardOpener?.({
						id: file.id,
						title: file.name,
						isAttached: true,
						analytics: {
							moduleId: 'mobile',
						},
					});
				}
			}
			catch (e)
			{
				// a failed board opener falls through to the native viewer below
				console.error(e);
			}
		}

		return openNativeViewer(params);
	}, 500);

	/**
	 * Primarily the default image is found by id: the same image can sit in different positions.
	 *
	 * @param {FileItem} image
	 * @param {number|string} [id]
	 * @param {string} [url]
	 * @return {boolean}
	 */
	function isDefaultImage(image, id, url)
	{
		if (image.id && id)
		{
			return image.id === id;
		}

		return getAbsolutePath(encodeURI(image.url)) === url;
	}

	/**
	 * @param {Array<FileItem>} files
	 * @param {number|string} [id]
	 * @param {string} [url]
	 * @return {Array<FileItem>}
	 */
	function prepareImageCollection(files, id, url)
	{
		return (
			files
				.filter(({ type, name }) => getNativeViewerMediaType(getMimeType(
					type,
					name,
				)) === NativeViewerMediaTypes.IMAGE)
				.map((image) => ({ ...image, default: isDefaultImage(image, id, url) ? true : undefined }))
		);
	}

	module.exports = { throttledNativeViewer, prepareImageCollection };
});
