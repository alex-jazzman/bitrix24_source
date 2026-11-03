type FeatureFlagValue =
	| 'ProjectsV2Feature'
	| 'SettingsV2Feature'
	| 'SupportFeature'
	| 'WhatsNewFeature'
	| 'DeveloperMenuEnabled'
	| 'SecuritySettingsFeature'
	| 'WorkReportsFeature'
	| 'ManagedTabPresetsFeature'
	| 'BitrixAnswersPersistentScreenFeature';

type FeatureFlagRequestOptions = {
	useCache?: boolean,
	skipRequestIfCacheExists?: boolean,
};

type FeatureFlagResponse = {
	data?: Partial<Record<FeatureFlagValue, boolean>>,
};
