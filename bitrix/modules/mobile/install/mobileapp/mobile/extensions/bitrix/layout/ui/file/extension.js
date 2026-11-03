/**
 * @module layout/ui/file
 */
jn.define('layout/ui/file', (require, exports, module) => {
	const { clone } = require('utils/object');
	const {
		getAbsolutePath,
		getExtension,
		getMimeType,
		getNativeViewerMediaType,
		NativeViewerMediaTypes,
	} = require('utils/file');
	const { resolveFileIcon, resolveFileTypeByMediaType } = require('assets/icons');
	const { prepareImageCollection, throttledNativeViewer } = require('layout/ui/file/viewer');
	const { deleteItem } = require('layout/ui/file/src/delete-item');
	const { Indent } = require('tokens');
	const { renderImage } = require('layout/ui/file/src/render-image');
	const { renderFile } = require('layout/ui/file/src/render-file');
	const { renderShimmedFile } = require('layout/ui/file/src/render-shimmed-file');
	const { renderMenuButton, renderDeleteButton } = require('layout/ui/file/src/action-button');

	const DEFAULT_PREVIEW_SIZE = 40;

	/**
	 * @param {FileProps} options
	 * @return {View}
	 */
	function File(options)
	{
		const { type, name, isShimmed, textLines, style } = options;
		const previewSize = options.previewSize ?? DEFAULT_PREVIEW_SIZE;

		if (isShimmed)
		{
			return View(
				{
					style: rootStyle(style),
				},
				renderShimmedFile({ previewSize, textLines }),
			);
		}

		const fileType = getNativeViewerMediaType(getMimeType(type, name));
		const imageUri = resolveImageUri(options, fileType);

		const tile = hasPreview(fileType, imageUri)
			? buildImageTile(options, previewSize, fileType, imageUri)
			: buildIconTile(options, previewSize, fileType);

		return renderTile(options, tile);
	}

	/**
	 * A local file is shown from itself: the picker knows its path before the server does.
	 * @param {FileProps} options
	 * @param {string} fileType
	 * @return {string}
	 */
	function resolveImageUri(options, fileType)
	{
		const { url, imageUri } = options;

		return (fileType === NativeViewerMediaTypes.IMAGE && url.indexOf('file://') === 0) ? url : imageUri;
	}

	/**
	 * A remote video has no preview to draw, so it falls back to the icon tile.
	 * @param {string} fileType
	 * @param {string} imageUri
	 * @return {boolean}
	 */
	function hasPreview(fileType, imageUri)
	{
		const isImage = (fileType === NativeViewerMediaTypes.IMAGE);
		const isVideo = (fileType === NativeViewerMediaTypes.VIDEO && imageUri.indexOf('file://') === 0);

		return (isImage || isVideo) && imageUri.length > 0;
	}

	/**
	 * @param {FileProps} options
	 * @param {number} previewSize
	 * @param {string} fileType
	 * @param {string} previewUri
	 * @return {FileTile}
	 */
	function buildImageTile(options, previewSize, fileType, previewUri)
	{
		const { id, name, showName, isLoading, hasError, textLines } = options;

		const imageUri = getAbsolutePath(encodeURI(previewUri));
		const url = getAbsolutePath(encodeURI(options.url));
		const files = Array.isArray(options.files) ? clone(options.files) : [];
		const images = prepareImageCollection(files, id, url);

		// the label doubles as the viewer title, so with the name hidden the viewer gets no title either
		const label = showName && name;

		return {
			content: renderImage({ imageUri, name: label, previewSize, isLoading, hasError, textLines }),
			viewerPayload: { fileType, url, name: label, images },
			menuPayload: { ...options, name: label, fileType, imageUri, url, files, images },
		};
	}

	/**
	 * @param {FileProps} options
	 * @param {number} previewSize
	 * @param {string} fileType
	 * @return {FileTile}
	 */
	function buildIconTile(options, previewSize, fileType)
	{
		const { id, name, isLoading, hasError, textLines, files = [] } = options;

		const url = encodeURI(options.url);
		const extension = getExtension(name || url);
		const icon = resolveFileIcon(extension, resolveFileTypeByMediaType(fileType));
		const file = files.find((fileObj) => Number(fileObj.id) === Number(id));

		return {
			content: renderFile({ icon, name, previewSize, isLoading, hasError, textLines }),
			viewerPayload: { fileType, url, name, file },
			menuPayload: { ...options, fileType, url, extension, icon },
		};
	}

	/**
	 * The badge is anchored to the root's corner, so the root keeps room above the preview for it to overhang;
	 * the consumer's style stacks on top — spacing between tiles or room for the badge to overhang sideways.
	 * @param {FileStyle} [style]
	 * @return {FileStyle}
	 */
	function rootStyle(style)
	{
		return {
			paddingTop: Indent.M.toNumber(),
			...style,
		};
	}

	/**
	 * @param {FileProps} options
	 * @param {FileTile} tile
	 * @return {View}
	 */
	function renderTile(options, tile)
	{
		const { style, attachmentCloseIcon, onDeleteAttachmentItem, onFilePreviewMenuClick } = options;

		return View(
			{
				testId: 'pinnedFileContainer',
				style: rootStyle(style),
				onClick: () => throttledNativeViewer(tile.viewerPayload),
			},
			tile.content,
			onFilePreviewMenuClick && renderMenuButton({
				onClick: () => onFilePreviewMenuClick(tile.menuPayload),
			}),
			!onFilePreviewMenuClick && onDeleteAttachmentItem && renderDeleteButton({
				attachmentCloseIcon,
				onClick: () => deleteItem(onDeleteAttachmentItem),
			}),
		);
	}

	module.exports = { File };
});
