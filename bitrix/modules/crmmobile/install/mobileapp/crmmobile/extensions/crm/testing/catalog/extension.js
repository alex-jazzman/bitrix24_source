/**
 * @module crm/testing/catalog
 */
jn.define('crm/testing/catalog', (require, exports, module) => {
	const { testingCatalog } = require('testing/catalog');

	testingCatalog.registerManifest({
		module: {
			id: 'crm',
			title: 'CRM',
			sortOrder: 200,
		},
		features: [
			{
				id: 'crm.in-app-url',
				title: 'Внутренние ссылки',
				sortOrder: 100,
			},
			{
				id: 'crm.work-time',
				title: 'Рабочее время',
				sortOrder: 200,
			},
			{
				id: 'crm.unified-filter',
				title: 'Единый фильтр',
				sortOrder: 300,
			},
		],
		tests: [
			{
				id: 'crm.in-app-url.routes',
				title: 'Внутренние ссылки',
				extensionName: 'crm:testing/tests/in-app-url/routes',
				featureIds: ['crm.in-app-url'],
				basic: false,
				sortOrder: 100,
			},
			{
				id: 'crm.in-app-url.query-params',
				title: 'Внутренние ссылки',
				extensionName: 'crm:testing/tests/in-app-url/routes/query-params',
				featureIds: ['crm.in-app-url'],
				basic: false,
				sortOrder: 150,
			},
			{
				id: 'crm.in-app-url.entity-list-target',
				title: 'Внутренние ссылки',
				extensionName: 'crm:testing/tests/in-app-url/entity-list-target',
				featureIds: ['crm.in-app-url'],
				basic: false,
				sortOrder: 170,
			},
			{
				id: 'crm.work-time.base',
				title: 'Рабочее время',
				extensionName: 'crm:testing/tests/work-time',
				featureIds: ['crm.work-time'],
				basic: false,
				sortOrder: 200,
			},
			{
				id: 'crm.unified-filter.field-icons',
				title: 'Единый фильтр',
				extensionName: 'crm:testing/tests/entity-tab/unified-filter',
				featureIds: ['crm.unified-filter'],
				basic: false,
				sortOrder: 300,
			},
			{
				id: 'crm.unified-filter.sort',
				title: 'Единый фильтр',
				extensionName: 'crm:testing/tests/entity-tab/sort',
				featureIds: ['crm.unified-filter'],
				basic: false,
				sortOrder: 350,
			},
			{
				id: 'crm.unified-filter.request',
				title: 'Единый фильтр',
				extensionName: 'crm:testing/tests/entity-tab/unified-filter-request',
				featureIds: ['crm.unified-filter'],
				basic: false,
				sortOrder: 400,
			},
		],
	});

	module.exports = {};
});
