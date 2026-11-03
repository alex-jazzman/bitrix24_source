/**
 * @module tab-presets/src/utils
 */
jn.define('tab-presets/src/utils', (require, exports, module) => {
	const { Icon } = require('ui-system/blocks/icon');
	const { downloadImages, makeLibraryImagePath } = require('asset-manager');
	const { RunActionExecutor } = require('rest/run-action-executor');

	/** @type {Record<string, BaseEnum>} */
	const icons = {
		chevron: Icon.CHEVRON_TO_THE_RIGHT,
		task: Icon.CIRCLE_CHECK,
		chat: Icon.MESSAGES,
		crm: Icon.CRM,
		menu: Icon.APPS,
		terminal: Icon.PAYMENT_TERMINAL,
		market: Icon.MARKET,
		marketplace: Icon.MARKET,
		catalog_store: Icon.INVENTORY_MANAGEMENT,
		projects: Icon.FOLDER,
		calendar: Icon.CALENDAR,
		stream: Icon.NEWSFEED,
		crm_custom_section: Icon.ACTIVITY,
		calendar_with_slots: Icon.CALENDAR_WITH_SLOTS,
		drag: Icon.DRAG,
		bizproc: Icon.BUSINESS_PROCESS,
		sign: Icon.SIGN,
		file: Icon.FILE,
		call_list: Icon.PHONE_UP,
		sync: Icon.RECORD_VIDEO,
		mail: Icon.MAIL,
		check_in: Icon.LOCATION,
	};

	/** @type {Record<TabPresetId, string>} */
	const presetInfoImagePath = {
		task: makeLibraryImagePath('project-management.svg', 'graphic'),
		stream: makeLibraryImagePath('company-feed.svg', 'graphic'),
		crm: makeLibraryImagePath('sales.svg', 'graphic'),
		collaboration: makeLibraryImagePath('teamwork.svg', 'graphic'),
		connection: makeLibraryImagePath('connection.svg', 'graphic'),
		terminal: makeLibraryImagePath('terminal.svg', 'graphic'),
		sign: makeLibraryImagePath('connection.svg', 'graphic'),
		bizproc: makeLibraryImagePath('connection.svg', 'graphic'),
	};

	const TabPresetsNewUtils = {
		/** @return {string} */
		cacheId: () => `tab.settings.user.${env.userId}`,
		/** @return {RunActionExecutor} */
		getPresetGetDataRequestExecutor: () => {
			return new RunActionExecutor('mobile.tabs.getData').setCacheId(TabPresetsNewUtils.cacheId());
		},
		/**
		 * @param {Record<TabPresetId, LegacyTabPreset>} list
		 * @param {TabPresetId} current
		 * @return {Record<TabPresetId, LegacyTabPreset>}
		 */
		getSortedPresets: (list, current) => {
			const result = {};
			const keys = Object.keys(list).filter((preset) => preset !== current);

			if (list[current])
			{
				keys.unshift(current);
			}
			keys.forEach((preset) => {
				result[preset] = list[preset];
			});

			return result;
		},
		/** @return {Promise<string|null>} */
		getCurrentPresetName: () => {
			return new RunActionExecutor('mobile.tabs.getCurrentPresetName')
				.setSkipDuplicateRequests()
				.call()
				.then((result) => {
					return result?.data ?? null;
				})
				.catch((error) => {
					console.error(error);

					return null;
				});
		},
		/** @return {Promise<unknown|null>} */
		getCurrentPresetItems: () => {
			return new RunActionExecutor('mobile.tabs.getCurrentPresetItems')
				.setSkipDuplicateRequests()
				.call()
				.then((result) => {
					return result?.data ?? null;
				})
				.catch((error) => {
					console.error(error);

					return null;
				});
		},
		/**
		 * @param {TabPresetId} name
		 * @return {Promise<unknown>}
		 */
		setCurrentPreset: (name) => {
			return new Promise((resolve, reject) => {
				void new RunActionExecutor('mobile.tabs.setPreset', { name })
					.setHandler((result, more, error) => {
						if (result && !error)
						{
							resolve(result);
						}
						else
						{
							reject(error);
						}
					})
					.call(false)
				;
			});
		},
		/**
		 * @param {TabPresetId} presetId
		 * @param {LegacyTabPreset|null|undefined} [preset]
		 * @return {void}
		 */
		changeCurrentPreset: (presetId, preset) => {
			Application.storage.updateObject(
				TabPresetsNewUtils.cacheId(),
				{},
				(saved) => {
					if (saved.presets)
					{
						return {
							...saved,
							presets: {
								...saved.presets,
								current: presetId,
								list: {
									...saved.presets.list,
									...(preset ? { [presetId]: preset } : {}),
								},
							},
						};
					}

					return saved;
				},
			);
			BX.onCustomEvent('onPresetChanged', [presetId]);
		},
		/**
		 * @param {TabPresetConfig} config
		 * @return {Promise<unknown>}
		 */
		setUserConfig: (config) => {
			return new RunActionExecutor('mobile.tabs.setConfig', { config }).call(false);
		},
		/**
		 * @param {string|null|undefined} code
		 * @return {BaseEnum|string}
		 */
		getIcon: (code) => {
			const list = ['crm_custom_section'];
			const modifiedCode = list.find((id) => code?.startsWith(id)) ?? code;

			return icons[modifiedCode] ?? '';
		},
		/**
		 * @param {TabPresetId} presetId
		 * @return {string}
		 */
		getPresetInfoImagePath: (presetId) => (presetInfoImagePath[presetId] ?? ''),
		/**
		 * @param {TabPresetId} presetId
		 * @return {Promise<unknown>}
		 */
		preloadPresetInfoImage: (presetId) => {
			const imagePath = TabPresetsNewUtils.getPresetInfoImagePath(presetId);
			if (!imagePath)
			{
				return Promise.resolve();
			}

			return downloadImages([imagePath]);
		},
	};

	module.exports = TabPresetsNewUtils;
});
