/**
 * @module im/messenger/controller/recent/service/render/lib/convertor/vibecode-app
 */
jn.define('im/messenger/controller/recent/service/render/lib/convertor/vibecode-app', (require, exports, module) => {
	const commonConvertToRecentItems = require('im/messenger/controller/recent/service/render/lib/convertor/common');
	const {
		MuteAction,
		UnmuteAction,
		PinAction,
		UnpinAction,
		ReadAction,
		UnreadAction,
		AddToFolderAction,
	} = require('im/messenger/lib/element/recent/item/action/action');

	const allowedActionIds = new Set([
		MuteAction.identifier,
		UnmuteAction.identifier,
		PinAction.identifier,
		UnpinAction.identifier,
		ReadAction.identifier,
		UnreadAction.identifier,
		AddToFolderAction.identifier,
	]);

	function retainAllowedActions(item)
	{
		if (Array.isArray(item.actions))
		{
			return Object.assign(item, {
				actions: item.actions.filter((action) => allowedActionIds.has(action.identifier)),
			});
		}

		return item;
	}

	/**
	 * @param {Array<RecentItem | object>} items
	 * @returns {Array<RecentWidgetItem | object>}
	 */
	function convertToRecentItems(items)
	{
		return commonConvertToRecentItems.call(this, items).map((item) => retainAllowedActions(item));
	}

	module.exports = convertToRecentItems;
});
