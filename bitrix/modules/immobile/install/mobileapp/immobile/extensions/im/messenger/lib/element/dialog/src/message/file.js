/**
 * @module im/messenger/lib/element/dialog/message/file
 */
jn.define('im/messenger/lib/element/dialog/message/file', (require, exports, module) => {
	const { Color } = require('tokens');

	const { MessageType } = require('im/messenger/const');
	const { Message } = require('im/messenger/lib/element/dialog/message/base');
	const { File } = require('im/messenger/lib/element/dialog/message/element/file/file');

	/**
	 * @class FileMessage
	 */
	class FileMessage extends Message
	{
		/**
		 * @param {MessagesModelState} modelMessage
		 * @param {CreateMessageOptions|{}} options
		 */
		constructor(modelMessage, options = {})
		{
			super(modelMessage, options);

			this.setMessage(modelMessage.text, { dialogId: options.dialogId });

			const [firstFile = {}] = this.getModelFiles();
			this.file = File.createByFileModel(firstFile).toMessageFormat();

			/* region deprecated properties */
			this.fileName = this.file.name;
			this.fileSize = this.file.size;
			this.fileIconDownloadSvg = this.file.iconDownloadSvg;
			this.fileIconSvg = this.file.iconSvg;
			/* end region */
		}

		/**
		 * @return {FileDialogWidgetItem}
		 */
		toDialogWidgetItem()
		{
			return {
				...super.toDialogWidgetItem(),
				file: this.file,
				fileName: this.fileName,
				fileSize: this.fileSize,
				fileIconDownloadSvg: this.fileIconDownloadSvg,
				fileIconSvg: this.fileIconSvg,
			};
		}

		getType()
		{
			return MessageType.file;
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
		FileMessage,
	};
});
