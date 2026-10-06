/**
 * @module tasks/testing/catalog
 */
jn.define('tasks/testing/catalog', (require, exports, module) => {
	const { Loc } = require('loc');
	const { testingCatalog } = require('testing/catalog');

	const featureTitles = {
		'tasks.checklist': Loc.getMessage('TASKS_TESTING_CATALOG_FEATURE_CHECKLIST'),
		'tasks.deadline-picker': Loc.getMessage('TASKS_TESTING_CATALOG_FEATURE_DEADLINE_PICKER'),
		'tasks.filter': Loc.getMessage('TASKS_TESTING_CATALOG_FEATURE_FILTER'),
		'tasks.redux': Loc.getMessage('TASKS_TESTING_CATALOG_FEATURE_REDUX'),
		'tasks.utils': Loc.getMessage('TASKS_TESTING_CATALOG_FEATURE_UTILS'),
	};

	const tests = [
		['tasks.checklist.text-field', 'tasks:testing/tests/checklist/text-field', 'tasks.checklist'],
		['tasks.deadline-picker.base', 'tasks:testing/tests/deadline-picker', 'tasks.deadline-picker'],
		['tasks.filter.task', 'tasks:testing/tests/filter/task', 'tasks.filter'],
		[
			'tasks.redux.field-change-registry',
			'tasks:testing/tests/redux/tasks/field-change-registry',
			'tasks.redux',
		],
		[
			'tasks.redux.counter-observer',
			'tasks:testing/tests/redux/tasks/observers/counter-observer',
			'tasks.redux',
		],
		[
			'tasks.redux.stateful-list-observer',
			'tasks:testing/tests/redux/tasks/observers/stateful-list-observer',
			'tasks.redux',
		],
		['tasks.utils.stages', 'tasks:testing/tests/utils/stages', 'tasks.utils'],
	].map(([id, extensionName, featureId], index) => ({
		id,
		title: featureTitles[featureId],
		extensionName,
		featureIds: [featureId],
		basic: false,
		sortOrder: (index + 1) * 10,
	}));

	testingCatalog.registerManifest({
		module: {
			id: 'tasks',
			title: Loc.getMessage('TASKS_TESTING_CATALOG_MODULE'),
			sortOrder: 300,
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
