/**
 * @module onboarding/active-tab-store
 */
jn.define('onboarding/active-tab-store', (require, exports, module) => {
	const { CacheStorage } = require('onboarding/cache');
	const { TabPresetsNewUtils } = require('tab-presets');
	const { CacheKey } = require('onboarding/const');
	const { Type } = require('type');
	const { Feature } = require('feature');

	class ActiveTabStore
	{
		static subscribeToTabChange()
		{
			BX.addCustomEvent('onTabsSelected', (tabId) => {
				if (tabId)
				{
					ActiveTabStore.#setActiveTab(tabId);
				}
			});
		}

		static async getActiveTab()
		{
			if (Feature.canGetAppActiveTab())
			{
				return PageManager.getNavigator().getActiveTab()
					.then((data) => {
						if (data)
						{
							return data.id;
						}

						return ActiveTabStore.#getActiveTabFromServer();
					})
					.catch((error) => {
						console.error(error);

						return ActiveTabStore.#getActiveTabFromServer();
					});
			}

			return ActiveTabStore.#getActiveTabFromServer();
		}

		static async #getActiveTabFromServer()
		{
			const activeTab = CacheStorage.get(CacheKey.ACTIVE_TAB);

			if (activeTab)
			{
				return activeTab;
			}

			const presetSet = await TabPresetsNewUtils.getCurrentPresetItems();

			if (!Type.isObjectLike(presetSet))
			{
				return null;
			}

			const firstTabId = Object.values(presetSet)[0];

			if (!firstTabId?.badgeCode)
			{
				return null;
			}

			ActiveTabStore.#setActiveTab(firstTabId.badgeCode);

			return firstTabId.badgeCode;
		}

		static #setActiveTab(id)
		{
			CacheStorage.set(CacheKey.ACTIVE_TAB, id);
		}
	}

	module.exports = {
		ActiveTabStore,
	};
});
