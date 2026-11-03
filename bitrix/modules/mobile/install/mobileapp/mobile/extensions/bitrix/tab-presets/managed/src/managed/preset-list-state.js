/**
 * @module tab-presets/managed/src/managed/preset-list-state
 */
jn.define('tab-presets/managed/src/managed/preset-list-state', (require, exports, module) => {
	const DEFAULT_SORT = 1000;

	/**
	 * @param {TabPresetItem} item
	 * @return {number}
	 */
	const getPresetGroupRank = (item) => {
		if (item?.isSelected === true)
		{
			return 0;
		}

		if (item?.isPortalDefault === true)
		{
			return 1;
		}

		if (item?.isManaged === true && item?.isOwner === true)
		{
			return 2;
		}

		if (item?.isManaged === true)
		{
			return 3;
		}

		return 4;
	};

	/**
	 * @param {TabPresetItem} left
	 * @param {TabPresetItem} right
	 * @return {number}
	 */
	const comparePresetItems = (left, right) => {
		const rankDiff = getPresetGroupRank(left) - getPresetGroupRank(right);
		if (rankDiff !== 0)
		{
			return rankDiff;
		}

		const sortDiff = (left?.sort ?? DEFAULT_SORT) - (right?.sort ?? DEFAULT_SORT);
		if (sortDiff !== 0)
		{
			return sortDiff;
		}

		const leftTitle = String(left?.title ?? left?.key ?? '');
		const rightTitle = String(right?.title ?? right?.key ?? '');
		if (leftTitle === rightTitle)
		{
			return 0;
		}

		return leftTitle > rightTitle ? 1 : -1;
	};

	/**
	 * @param {TabPresetItem[]} [items]
	 * @return {TabPresetItem[]}
	 */
	const sortPresetItems = (items = []) => [...items].sort(comparePresetItems);

	module.exports = {
		sortPresetItems,
	};
});
