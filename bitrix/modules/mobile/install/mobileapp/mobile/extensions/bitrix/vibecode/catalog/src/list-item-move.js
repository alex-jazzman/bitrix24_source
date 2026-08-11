/**
 * @module vibecode/catalog/src/list-item-move
 */
jn.define('vibecode/catalog/src/list-item-move', (require, exports, module) => {
	function getFirstUnpinnedIndex(items = [])
	{
		const index = items.findIndex((item) => item?.isPinned !== true);

		return index === -1 ? items.length : index;
	}

	function getVibeCodeItemMoveIndex(items = [], isPinned = false)
	{
		return isPinned ? 0 : getFirstUnpinnedIndex(items);
	}

	function prepareVibeCodeItemForState(item = {}, isPinned = false)
	{
		const { isLast, ...stateItem } = item;

		return {
			...stateItem,
			isPinned,
		};
	}

	function getPreparedItemsToUpdateAfterMove({
		preparedItems = [],
		itemId = '',
		currentIndex = 0,
		insertIndex = 0,
	} = {})
	{
		const affectedIndexes = [
			currentIndex - 1,
			currentIndex,
			insertIndex - 1,
			insertIndex,
		];
		const affectedIds = new Set([String(itemId)]);

		affectedIndexes.forEach((index) => {
			const id = String(preparedItems[index]?.id ?? '');
			if (id)
			{
				affectedIds.add(id);
			}
		});

		return preparedItems.filter((preparedItem) => affectedIds.has(String(preparedItem?.id ?? '')));
	}

	module.exports = {
		getPreparedItemsToUpdateAfterMove,
		getVibeCodeItemMoveIndex,
		prepareVibeCodeItemForState,
	};
});
