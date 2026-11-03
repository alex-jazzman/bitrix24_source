/**
 * @module tasks/testing/catalog
 */
jn.define('tasks/testing/catalog', (require, exports, module) => {
	const { testingCatalog } = require('testing/catalog');

	const featureTitles = {
		'tasks.checklist': 'Чек-листы',
		'tasks.deadline-picker': 'Сроки задач',
		'tasks.filter': 'Фильтр задач',
		'tasks.in-app-url': 'Внутренние ссылки',
		'tasks.redux': 'Состояние задач',
		'tasks.utils': 'Утилиты задач',
	};

	const checklistReduxTests = [
		'cascade-replace',
		'checklists-reducer',
		'children-index',
		'create-rekey',
		'dod',
		'dod-serializer',
		'filter-reseed',
		'items-reducer',
		'model',
		'move-to-checklist',
		'open-by-server-id',
		'optimistic-rollback',
		'presenter/checklist',
		'presenter/item',
		'replace-from-server',
		'selector-cycle-guard',
		'server-updates',
		'tab-out-order',
		'thunk-condition',
		'title-debounce',
		'toggle-filter',
		'view-model-base',
		'view-model-support',
	].map((suite) => [
		`tasks.checklist.redux.${suite.replace('/', '-')}`,
		`tasks:testing/tests/redux/checklists/${suite}`,
		'tasks.checklist',
	]);

	const tests = [
		['tasks.checklist.text-field', 'tasks:testing/tests/checklist/text-field', 'tasks.checklist'],
		...checklistReduxTests,
		[
			'tasks.checklist.redux.templates-summary',
			'tasks:testing/tests/redux/templates/checklist-summary',
			'tasks.checklist',
		],
		['tasks.deadline-picker.base', 'tasks:testing/tests/deadline-picker', 'tasks.deadline-picker'],
		['tasks.filter.task', 'tasks:testing/tests/filter/task', 'tasks.filter'],
		['tasks.in-app-url.routes', 'tasks:testing/tests/in-app-url/routes', 'tasks.in-app-url'],
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
			title: 'Задачи и проекты',
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
