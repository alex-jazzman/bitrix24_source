/**
 * @module im/messenger/controller/recent/service/render/lib/convertor/collab-default
 */
jn.define('im/messenger/controller/recent/service/render/lib/convertor/collab-default', (require, exports, module) => {
	const { DialogHelper } = require('im/messenger/lib/helper');
	const { CollabParentChatItem } = require('im/messenger/lib/element/recent/item/chat/collab-parent');
	const commonConvertToRecentItems = require('im/messenger/controller/recent/service/render/lib/convertor/common');

	/**
	 * @param {Array<RecentItem | object>} items
	 * @returns {Array<RecentWidgetItem | object>}
	 */
	function convertToRecentItems(items)
	{
		const base = commonConvertToRecentItems.call(this, items);

		return base.map((item) => {
			const dialogHelper = DialogHelper.createByDialogId(item.id);
			if (dialogHelper?.isCollab)
			{
				return new CollabParentChatItem(item.params.model.recent, item.params.options);
			}

			return item;
		});
	}

	module.exports = convertToRecentItems;
});
