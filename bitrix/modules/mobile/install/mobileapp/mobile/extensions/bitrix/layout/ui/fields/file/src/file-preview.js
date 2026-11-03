/**
 * @module layout/ui/fields/file/src/file-preview
 */
jn.define('layout/ui/fields/file/src/file-preview', (require, exports, module) => {
	const { File } = require('layout/ui/file');

	/**
	 * @param {FileFieldPreviewProps} props
	 * @return {View}
	 */
	const filePreview = ({
		file,
		index,
		files,
		onDeleteFile,
		showName,
		textLines = 2,
		leftIndent = 3,
		onFilePreviewMenuClick = null,
	}) => {
		return View(
			{
				style: {
					marginRight: leftIndent,
				},
			},
			File({
				id: file.id,
				url: file.url,
				imageUri: file.previewUrl || file.url,
				type: file.type,
				name: file.name,
				readOnly: file.readOnly || false,
				isLoading: file.isUploading || false,
				isShimmed: file.isShimmed || false,
				hasError: file.hasError || false,
				onDeleteAttachmentItem: onDeleteFile && (() => onDeleteFile(index)),
				files,
				showName,
				textLines,
				onFilePreviewMenuClick,
			}),
		);
	};

	module.exports = { filePreview };
});
