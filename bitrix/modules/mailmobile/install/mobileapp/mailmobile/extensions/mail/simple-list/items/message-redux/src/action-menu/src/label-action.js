/**
 * @module mail/simple-list/items/message-redux/src/action-menu/src/label-action
 */
jn.define('mail/simple-list/items/message-redux/src/action-menu/src/label-action', (require, exports, module) => {
	/**
	 * Whether the row menu shows the label action. Kept apart from the menu itself: the rule needs no
	 * layout behind it, and the menu extension pulls in the whole message card to build the sheet.
	 */
	function isLabelActionVisible({ labelsAvailable, message, isOnline, readOnly, isMultiSelectMode = false })
	{
		return labelsAvailable === true
			&& Boolean(message?.uidId)
			&& isOnline === true
			&& readOnly !== true
			&& isMultiSelectMode !== true
		;
	}

	module.exports = { isLabelActionVisible };
});
