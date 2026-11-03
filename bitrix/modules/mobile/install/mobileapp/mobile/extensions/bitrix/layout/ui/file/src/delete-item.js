/**
 * @module layout/ui/file/src/delete-item
 */
jn.define('layout/ui/file/src/delete-item', (require, exports, module) => {
	const { confirmDestructiveAction } = require('alert');
	const { Loc } = require('loc');

	/**
	 * @param {() => void} onDeleteAttachmentItem
	 */
	function deleteItem(onDeleteAttachmentItem)
	{
		confirmDestructiveAction({
			title: '',
			description: Loc.getMessage('UI_FILE_ATTACHMENT_DELETE_CONFIRM_TITLE_MSGVER_1'),
			onDestruct: onDeleteAttachmentItem,
		});
	}

	module.exports = { deleteItem };
});
