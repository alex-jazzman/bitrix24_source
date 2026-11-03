/**
 * @module disk/testing/catalog
 */
jn.define('disk/testing/catalog', (require, exports, module) => {
	const { Loc } = require('loc');
	const { testingCatalog } = require('testing/catalog');

	testingCatalog.registerManifest({
		module: {
			id: 'disk',
			title: Loc.getMessage('DISK_TESTING_CATALOG_MODULE'),
			sortOrder: 400,
		},
		features: [
			{
				id: 'disk.unified-link',
				title: Loc.getMessage('DISK_TESTING_CATALOG_FEATURE_UNIFIED_LINK'),
				sortOrder: 100,
			},
		],
		tests: [
			{
				id: 'disk.unified-link.smoke',
				title: Loc.getMessage('DISK_TESTING_CATALOG_TEST_UNIFIED_LINK_SMOKE'),
				extensionName: 'disk:testing/tests/unified-link/smoke',
				featureIds: ['disk.unified-link'],
				basic: false,
				sortOrder: 50,
			},
			{
				id: 'disk.unified-link.routes',
				title: Loc.getMessage('DISK_TESTING_CATALOG_TEST_UNIFIED_LINK_ROUTES'),
				extensionName: 'disk:testing/tests/unified-link/routes',
				featureIds: ['disk.unified-link'],
				basic: false,
				sortOrder: 100,
			},
			{
				id: 'disk.unified-link.opener',
				title: Loc.getMessage('DISK_TESTING_CATALOG_TEST_UNIFIED_LINK_OPENER'),
				extensionName: 'disk:testing/tests/unified-link/opener',
				featureIds: ['disk.unified-link'],
				basic: false,
				sortOrder: 200,
			},
			{
				id: 'disk.unified-link.folder-grid',
				title: Loc.getMessage('DISK_TESTING_CATALOG_TEST_UNIFIED_LINK_FOLDER_GRID'),
				extensionName: 'disk:testing/tests/unified-link/folder-grid',
				featureIds: ['disk.unified-link'],
				basic: false,
				sortOrder: 400,
			},
			{
				id: 'disk.unified-link.folder-tree',
				title: Loc.getMessage('DISK_TESTING_CATALOG_TEST_UNIFIED_LINK_FOLDER_TREE'),
				extensionName: 'disk:testing/tests/unified-link/folder-tree',
				featureIds: ['disk.unified-link'],
				basic: false,
				sortOrder: 450,
			},
			{
				id: 'disk.unified-link.thunk',
				title: Loc.getMessage('DISK_TESTING_CATALOG_TEST_UNIFIED_LINK_THUNK'),
				extensionName: 'disk:testing/tests/unified-link/thunk',
				featureIds: ['disk.unified-link'],
				basic: false,
				sortOrder: 480,
			},
			{
				id: 'disk.unified-link.uploader',
				title: Loc.getMessage('DISK_TESTING_CATALOG_TEST_UNIFIED_LINK_UPLOADER'),
				extensionName: 'disk:testing/tests/unified-link/uploader',
				featureIds: ['disk.unified-link'],
				basic: false,
				sortOrder: 490,
			},
			{
				id: 'disk.unified-link.pull',
				title: Loc.getMessage('DISK_TESTING_CATALOG_TEST_UNIFIED_LINK_PULL'),
				extensionName: 'disk:testing/tests/unified-link/pull',
				featureIds: ['disk.unified-link'],
				basic: false,
				sortOrder: 495,
			},
			{
				id: 'disk.unified-link.action-menu',
				title: Loc.getMessage('DISK_TESTING_CATALOG_TEST_UNIFIED_LINK_ACTION_MENU'),
				extensionName: 'disk:testing/tests/unified-link/action-menu',
				featureIds: ['disk.unified-link'],
				basic: false,
				sortOrder: 500,
			},
		],
	});

	module.exports = {};
});
