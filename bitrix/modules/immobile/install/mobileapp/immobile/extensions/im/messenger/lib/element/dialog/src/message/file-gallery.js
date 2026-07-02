/**
 * @module im/messenger/lib/element/dialog/message/file-gallery
 */
jn.define('im/messenger/lib/element/dialog/message/file-gallery', (require, exports, module) => {
	const { Color } = require('tokens');
	const { MessageType } = require('im/messenger/const');
	const { Message } = require('im/messenger/lib/element/dialog/message/base');
	const { File } = require('im/messenger/lib/element/dialog/message/element/file/file');

	/**
	 * @class FileGalleryMessage
	 */
	class FileGalleryMessage extends Message
	{
		fileList;

		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions|{}} options
		 */
		constructor(modelMessage, options = {})
		{
			super(modelMessage, options);

			this.setMessage(modelMessage.text);

			this.fileList = this.createFileList(this.getModelFiles());
		}

		/**
		 * @return {FileGalleryDialogWidgetItem}
		 */
		toDialogWidgetItem()
		{
			return {
				...super.toDialogWidgetItem(),
				fileList: this.fileList,
			};
		}

		/**
		 * @protected
		 * @return {string}
		 */
		getType()
		{
			return MessageType.fileGallery;
		}

		/**
		 * @protected
		 * @param {Array<FilesModelState>} fileList
		 */
		createFileList(fileList)
		{
			return fileList.map((file) => {
				return File.createByFileModel(file).toMessageFormat();
			});
		}

		setSystemStyle()
		{
			super.setSystemStyle();

			this.style.file = {
				nameColor: Color.base1.toHex(),
				downloadIconColor: Color.chatOtherBase1_1.toHex(),
				progressIconColor: Color.accentMainPrimary.toHex(),
				fileSizeColor: Color.chatOtherBase1_1.toHex(),
			};

			return this;
		}
	}

	module.exports = {
		FileGalleryMessage,
	};
});
