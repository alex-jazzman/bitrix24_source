<?php

return [
	'components' => [
		'tasks:tasks.dashboard', // @keep
		'tasks:tasks.task.view-new', // @keep
	],
	'extensions' => [
		'layout/ui/info-helper',
		'loc',
		'notify',
		'require-lazy',
		'rest/run-action-executor',
		'settings/disabled-tools',
		'statemanager/redux/store',
		'tariff-plan-restriction',
		'toast',
		'tokens',
		'type',
		'utils/guid',
		'tasks:enum',
		'tasks:statemanager/redux/slices/tasks',
	],
];
