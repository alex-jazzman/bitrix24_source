/**
 * @module crm/testing/catalog
 */
jn.define('crm/testing/catalog', (require, exports, module) => {
	const { Loc } = require('loc');
	const { testingCatalog } = require('testing/catalog');

	testingCatalog.registerManifest({
		module: {
			id: 'crm',
			title: Loc.getMessage('CRM_TESTING_CATALOG_MODULE'),
			sortOrder: 200,
		},
		features: [
			{
				id: 'crm.work-time',
				title: Loc.getMessage('CRM_TESTING_CATALOG_FEATURE_WORK_TIME'),
				sortOrder: 100,
			},
		],
		tests: [
			{
				id: 'crm.work-time.base',
				title: Loc.getMessage('CRM_TESTING_CATALOG_FEATURE_WORK_TIME'),
				extensionName: 'crm:testing/tests/work-time',
				featureIds: ['crm.work-time'],
				basic: false,
				sortOrder: 100,
			},
		],
	});

	module.exports = {};
});
