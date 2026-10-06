/**
 * @module testing/catalog/mobile
 */
jn.define('testing/catalog/mobile', (require, exports, module) => {
	const { Loc } = require('loc');
	const { testingCatalog } = require('testing/catalog');

	const featureTitles = {
		'mobile.app-rating-manager': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_APP_RATING_MANAGER'),
		'mobile.asset-manager': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_ASSET_MANAGER'),
		'mobile.bbcode-source-format': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_BBCODE_SOURCE_FORMAT'),
		'mobile.detail-card': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_DETAIL_CARD'),
		'mobile.enums': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_ENUMS'),
		'mobile.env': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_ENV'),
		'mobile.floating-action-button': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_FLOATING_ACTION_BUTTON'),
		'mobile.in-app-url': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_IN_APP_URL'),
		'mobile.layout': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_LAYOUT'),
		'mobile.onboarding': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_ONBOARDING'),
		'mobile.personal-account': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_PERSONAL_ACCOUNT'),
		'mobile.product-calculator': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_PRODUCT_CALCULATOR'),
		'mobile.project': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_PROJECT'),
		'mobile.reaction': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_REACTION'),
		'mobile.redux.optimistic-ui': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_REDUX_OPTIMISTIC_UI'),
		'mobile.selector': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_SELECTOR'),
		'mobile.stateful-list': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_STATEFUL_LIST'),
		'mobile.testing': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_TESTING'),
		'mobile.tourist': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_TOURIST'),
		'mobile.utils': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_UTILS'),
		'mobile.vibecode': Loc.getMessage('MOBILE_TESTING_CATALOG_FEATURE_VIBECODE'),
	};

	const tests = [
		['mobile.app-rating-manager.base', 'testing/tests/app-rating-manager', 'mobile.app-rating-manager'],
		['mobile.asset-manager.base', 'testing/tests/asset-manager', 'mobile.asset-manager'],
		['mobile.testing.basic-expectations', 'testing/tests/basic-expectations', 'mobile.testing', true],
		['mobile.bbcode-source-format.base', 'testing/tests/bbcode-source-format', 'mobile.bbcode-source-format'],
		['mobile.detail-card.recent-storage', 'testing/tests/detail-card/recent-storage', 'mobile.detail-card'],
		['mobile.enums.gratitude', 'testing/tests/enums/gratitude', 'mobile.enums'],
		['mobile.env.base', 'testing/tests/env', 'mobile.env'],
		['mobile.floating-action-button.base', 'testing/tests/floating-action-button', 'mobile.floating-action-button'],
		['mobile.in-app-url.base', 'testing/tests/in-app-url', 'mobile.in-app-url'],
		['mobile.in-app-url.note', 'testing/tests/in-app-url/note', 'mobile.in-app-url'],
		['mobile.in-app-url.route', 'testing/tests/in-app-url/route', 'mobile.in-app-url'],
		['mobile.in-app-url.url', 'testing/tests/in-app-url/url', 'mobile.in-app-url'],
		['mobile.layout.collapsible-text', 'testing/tests/layout/ui/collapsible-text', 'mobile.layout'],
		['mobile.layout.step-progress-bar', 'testing/tests/layout/ui/step-progress-bar', 'mobile.layout'],
		['mobile.onboarding.cache-storage', 'testing/tests/onboarding/cache-storage', 'mobile.onboarding'],
		['mobile.onboarding.case', 'testing/tests/onboarding/case', 'mobile.onboarding'],
		['mobile.onboarding.visit-counter', 'testing/tests/onboarding/visit-counter', 'mobile.onboarding'],
		[
			'mobile.personal-account.document-view',
			'testing/tests/more-menu/block/company/personal-account/src/steps/document-view',
			'mobile.personal-account',
		],
		[
			'mobile.personal-account.flow',
			'testing/tests/more-menu/block/company/personal-account/src/flow',
			'mobile.personal-account',
		],
		[
			'mobile.personal-account.pull-handler',
			'testing/tests/more-menu/block/company/personal-account/src/pull/pull-handler',
			'mobile.personal-account',
		],
		[
			'mobile.personal-account.resend-button',
			'testing/tests/more-menu/block/company/personal-account/src/steps/resend-button',
			'mobile.personal-account',
		],
		['mobile.product-calculator.base', 'testing/tests/product-calculator', 'mobile.product-calculator'],
		['mobile.project.widget', 'testing/tests/project/widget', 'mobile.project'],
		['mobile.reaction.icon', 'testing/tests/reaction/icon', 'mobile.reaction'],
		['mobile.reaction.pack', 'testing/tests/reaction/pack', 'mobile.reaction'],
		['mobile.redux.optimistic-ui.base', 'testing/tests/redux/optimistic-ui', 'mobile.redux.optimistic-ui'],
		['mobile.selector.widget', 'testing/tests/selector/widget', 'mobile.selector'],
		[
			'mobile.stateful-list.group-items-by-operations',
			'testing/tests/stateful-list/group-items-by-operations',
			'mobile.stateful-list',
		],
		['mobile.stateful-list.optimize-queue', 'testing/tests/stateful-list/optimize-queue', 'mobile.stateful-list'],
		['mobile.testing.catalog', 'testing/tests/testing/catalog', 'mobile.testing'],
		['mobile.testing.runner', 'testing/tests/testing/runner', 'mobile.testing'],
		['mobile.tourist.base', 'testing/tests/tourist', 'mobile.tourist'],
		['mobile.utils.date-formatter-factory', 'testing/tests/utils/date-formatter-factory', 'mobile.utils'],
		['mobile.utils.date.duration', 'testing/tests/utils/date/duration', 'mobile.utils'],
		['mobile.utils.date.dynamic-date-formatter', 'testing/tests/utils/date/dynamic-date-formatter', 'mobile.utils'],
		['mobile.utils.date.moment', 'testing/tests/utils/date/moment', 'mobile.utils'],
		['mobile.utils.dynamic-date-formatter', 'testing/tests/utils/dynamic-date-formatter', 'mobile.utils'],
		['mobile.utils.email', 'testing/tests/utils/email', 'mobile.utils'],
		['mobile.utils.enums', 'testing/tests/utils/enums', 'mobile.utils'],
		['mobile.utils.base', 'testing/tests/utils', 'mobile.utils'],
		['mobile.utils.human-date-formatter', 'testing/tests/utils/human-date-formatter', 'mobile.utils'],
		['mobile.utils.logger', 'testing/tests/utils/logger', 'mobile.utils'],
		['mobile.utils.object', 'testing/tests/utils/object', 'mobile.utils'],
		['mobile.utils.request-manager', 'testing/tests/utils/request-manager', 'mobile.utils'],
		['mobile.utils.url.base', 'testing/tests/utils/url', 'mobile.utils'],
		['mobile.utils.url.social', 'testing/tests/utils/url/social', 'mobile.utils'],
		['mobile.utils.validation', 'testing/tests/utils/validation', 'mobile.utils'],
		['mobile.vibecode.header-controller', 'testing/tests/vibecode/catalog/header-controller', 'mobile.vibecode'],
		[
			'mobile.vibecode.item-actions-controller',
			'testing/tests/vibecode/catalog/item-actions-controller',
			'mobile.vibecode',
		],
		['mobile.vibecode.open-in-app', 'testing/tests/vibecode/catalog/open-in-app', 'mobile.vibecode'],
		['mobile.vibecode.provider', 'testing/tests/vibecode/catalog/provider', 'mobile.vibecode'],
		['mobile.vibecode.renderer', 'testing/tests/vibecode/catalog/renderer', 'mobile.vibecode'],
	].map(([id, extensionName, featureId, basic = false], index) => ({
		id,
		title: featureTitles[featureId],
		extensionName,
		featureIds: [featureId],
		basic,
		sortOrder: (index + 1) * 10,
	}));

	testingCatalog.registerManifest({
		module: {
			id: 'mobile',
			title: Loc.getMessage('MOBILE_TESTING_CATALOG_MODULE_MOBILE'),
			sortOrder: 100,
		},
		features: Object.entries(featureTitles).map(([id, title], index) => ({
			id,
			title,
			sortOrder: (index + 1) * 10,
		})),
		tests,
	});

	module.exports = {};
});
