/**
 * @module im/messenger/controller/folder/chat-selector
 */
jn.define('im/messenger/controller/folder/chat-selector', (require, exports, module) => {
	const { openDialogSelector } = require('im/messenger/controller/selector/dialog/opener');
	const { Loc } = require('im/messenger/loc');
	const { getLoggerWithContext } = require('im/messenger/lib/logger');

	const logger = getLoggerWithContext('folder--chat-selector', 'FolderChatSelector');

	class FolderChatSelector
	{
		/**
		 * @param {Object} options
		 * @param {number[]} [options.selectedChatIds]
		 * @param {Function} options.onComplete - callback with selected dialogIds[]
		 */
		static open(options = {}, parentWidget)
		{
			const { selectedChatIds = [], onComplete } = options;

			openDialogSelector({
				title: Loc.getMessage('IMMOBILE_FOLDER_CHAT_PICKER_TITLE'),
				providerOptions: {
					allowMultipleSelection: true,
					useNotes: true,
					initialDialogIds: selectedChatIds,
				},
				allowMultipleSelection: true,
				closeOnSelect: true,
				sendButtonName: Loc.getMessage('IMMOBILE_FOLDER_CHAT_PICKER_SUBMIT_BUTTON'),
				initSelectedIds: selectedChatIds,
				onClose: (selectedItems) => {
					const dialogIds = (selectedItems || []).map((item) => item.id);
					logger.log('closed with', dialogIds);
					if (onComplete)
					{
						onComplete(dialogIds);
					}
				},
			}, parentWidget);
		}
	}

	module.exports = { FolderChatSelector };
});
