/**
 * @module tab-presets/managed/editors/src/preset-managed/managed-preset-form-state
 */
jn.define('tab-presets/managed/editors/src/preset-managed/managed-preset-form-state', (require, exports, module) => {
	const {
		ManagedPresetMenuItemType,
	} = require('tab-presets/managed/editors/src/preset-managed/managed-preset-menu-item-type');
	const { getManagedPresetId } = require('tab-presets/managed');

	/**
	 * @param {ManagedPresetFormStateParams} params
	 * @return {ManagedPresetFormState}
	 */
	function createManagedPresetFormState({ tabs, preset = null })
	{
		const list = tabs?.list ?? {};
		const current = tabs?.current ?? {};
		const config = preset?.tabs ?? getCurrentPresetTabsConfig(current);
		const activeKeys = Object.keys(config).sort((a, b) => config[a] - config[b]);

		const activeItems = activeKeys.map((key) => {
			const currentItem = current[key] ?? {};
			const listItem = list[key] ?? {};
			const canChangeSort = currentItem.canChangeSort ?? true;

			return {
				...currentItem,
				...listItem,
				key,
				type: canChangeSort ? ManagedPresetMenuItemType.ACTIVE : ManagedPresetMenuItemType.STATIC,
				showBorderBottom: canChangeSort,
			};
		});

		const inactiveItems = Object.keys(list)
			.filter((key) => !activeKeys.includes(key))
			.map((key) => ({
				...list[key],
				key,
				type: ManagedPresetMenuItemType.INACTIVE,
				canBeRemoved: true,
				showBorderBottom: true,
			}))
		;

		return {
			activeItems,
			inactiveItems,
		};
	}

	/**
	 * @param {Record<string, TabPresetTab> | undefined} current
	 * @return {Record<string, number>}
	 */
	function getCurrentPresetTabsConfig(current)
	{
		return Object.fromEntries(
			Object.keys(current ?? {}).map((key, index) => [
				key,
				current[key]?.sort ?? index,
			]),
		);
	}

	/**
	 * @param {ManagedPresetMenuItem[]} activeItems
	 * @return {Record<string, number>}
	 */
	function getPresetTabsConfig(activeItems)
	{
		return Object.fromEntries(activeItems.map((item, index) => [item.key, index]));
	}

	module.exports = {
		createManagedPresetFormState,
		getCurrentPresetTabsConfig,
		getPresetTabsConfig,
		getManagedPresetId,
	};
});
