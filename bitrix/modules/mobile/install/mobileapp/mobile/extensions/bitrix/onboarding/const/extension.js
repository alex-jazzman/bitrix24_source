/**
 * @module onboarding/const
 */
jn.define('onboarding/const', (require, exports, module) => {
	const BadgeCode = {
		TASKS: 'tasks',
		MESSENGER: 'chats',
		CRM: 'crm',
		MORE: 'more',
		CALENDAR: 'calendar',
		ANY: 'any',
	};

	const CaseName = {
		ON_PROFILE_SHOULD_BE_FILLED: 'mobile:onProfileShouldBeFilled',
	};

	const Preset = {
		TASKS: 'task',
		CRM: 'crm',
		MESSENGER: 'collaboration',
		ANY: 'any',
	};

	const CacheKey = {
		ACTIVE_TAB: 'activeTab',
		HINTS_COUNT: 'hintsCount',
		SHOWN_IDS: 'shownIds',
	};

	const ServerKey = {
		HINTS_COUNT: 'onboarding_hints_count',
		CASES: 'onboarding_cases',
	};

	const VisitPeriod = {
		ONE_DAY: 'onboardingDay',
	};

	module.exports = {
		BadgeCode,
		CacheKey,
		CaseName,
		Preset,
		ServerKey,
		VisitPeriod,
	};
});
