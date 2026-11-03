/**
 * @module feature-flag
 */
jn.define('feature-flag', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	/** @type {Record<string, FeatureFlagValue>} */
	const FeatureFlagType = {
		PROJECTS_V2: 'ProjectsV2Feature',
		SETTINGS_V2: 'SettingsV2Feature',
		SUPPORT: 'SupportFeature',
		FEEDBACK_ROUTER: 'FeedbackRouterFeature',
		WHATS_NEW: 'WhatsNewFeature',
		DEVELOPER_MENU: 'DeveloperMenuEnabled',
		SECURITY_SETTINGS: 'SecuritySettingsFeature',
		WORK_REPORTS: 'WorkReportsFeature',
		MANAGED_TAB_PRESETS: 'ManagedTabPresetsFeature',
		CHECKLIST_ON_COMPLETE: 'ChecklistOnCompleteFeature',
		WORK_REPORTS_WITH_AI: 'WorkReportsWithAiFeature',
		TARIFF_MENU: 'TariffMenuFeature',
		TARIFF_MENU_PURCHASE_CTA: 'TariffMenuPurchaseCtaFeature',
		TARIFF_MENU_DEMO_MODE: 'TariffMenuDemoModeFeature',
		TEXT_EDITOR: 'TextEditorFeature',
		TASK_EMAIL: 'TaskEmailFeature',
		SELF_DELETE_V2: 'SelfDeleteV2Feature',
		BITRIX_ANSWERS_PERSISTENT_SCREEN: 'BitrixAnswersPersistentScreenFeature',
	};

	/**
	 * @param {FeatureFlagRequestOptions} options
	 * @return {Promise<FeatureFlagResponse>}
	 */
	function getFeatureFlags(options = {})
	{
		const {
			useCache = true,
			skipRequestIfCacheExists = true,
		} = options;
		const shouldSkipRequestIfCacheExists = useCache && skipRequestIfCacheExists;

		const executor = new RunActionExecutor('mobile.FeatureFlag.getFeatureFlags');
		executor
			.setCacheId('FeatureFlags')
			.setCacheTtl(86400)
			.setCacheHandler(() => {})
			.enableJson()
		;

		if (shouldSkipRequestIfCacheExists)
		{
			executor.setSkipRequestIfCacheExists();
		}

		return executor.call(useCache);
	}

	/**
	 * @param {FeatureFlagValue} featureFlag
	 * @param {FeatureFlagRequestOptions} options
	 * @return {Promise<boolean|undefined>}
	 */
	async function checkFeatureFlag(featureFlag, options = {})
	{
		if (!Object.values(FeatureFlagType).includes(featureFlag))
		{
			console.error(`Invalid feature flag requested. \n Expected one of: ${Object.values(FeatureFlagType).join(', ')}. Received: "${featureFlag}"`);
		}

		const response = await getFeatureFlags(options);

		return response?.data?.[featureFlag];
	}

	module.exports = {
		FeatureFlagType,
		getFeatureFlags,
		checkFeatureFlag,
	};
});
