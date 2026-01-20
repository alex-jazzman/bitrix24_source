<?php

return [
	'components' => [
		'tasks:tasks.dashboard',
		'tasks:tasks.task.view-new',
	],
	'extensions' => [
		'layout/ui/info-helper',
		'loc',
		'notify-manager',
		'require-lazy',
		'rest/run-action-executor',
		'settings/disabled-tools',
		'statemanager/redux/store',
		'tariff-plan-restriction',
		'tasks:enum',
		'toast',
		'tokens',
		'type',
		'ui-system/blocks/icon',

		'tasks:layout/action-menu/actions',
		'tasks:statemanager/redux/slices/tasks',
		'notify',
	],
];
