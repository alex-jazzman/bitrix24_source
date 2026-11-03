/**
 * @module tab-presets/src/preset-menu-state
 */
jn.define('tab-presets/src/preset-menu-state', (require, exports, module) => {
	const STATIC_ITEM_TYPE = 'static';

	/**
	 * @param {Array<TabPresetMenuItem>} items
	 * @param {number} maxItems
	 * @return {Array<TabPresetMenuItem>}
	 */
	function getDraggableMenuItems(items, maxItems)
	{
		return items
			.filter((item) => item.type !== STATIC_ITEM_TYPE)
			.slice(0, maxItems)
		;
	}

	/**
	 * @param {Array<TabPresetMenuItem>} items
	 * @param {number} fromIndex
	 * @param {number} toIndex
	 * @return {Array<TabPresetMenuItem>}
	 */
	function moveDraggableMenuItem(items, fromIndex, toIndex)
	{
		const result = [...items];
		const draggableItems = getDraggableMenuItems(result, result.length);
		if (
			fromIndex === toIndex
			|| fromIndex < 0
			|| toIndex < 0
			|| fromIndex >= draggableItems.length
			|| toIndex >= draggableItems.length
		)
		{
			return result;
		}

		const [movedItem] = draggableItems.splice(fromIndex, 1);
		draggableItems.splice(toIndex, 0, movedItem);

		let draggableIndex = 0;

		return result.map((item) => (
			item.type === STATIC_ITEM_TYPE ? item : draggableItems[draggableIndex++]
		));
	}

	module.exports = {
		getDraggableMenuItems,
		moveDraggableMenuItem,
	};
});
