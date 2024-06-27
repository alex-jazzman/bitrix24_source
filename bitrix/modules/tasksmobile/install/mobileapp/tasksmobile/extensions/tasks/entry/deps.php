<?php

return [
	'components' => [
		'tasks:tasks.dashboard',
		'tasks:tasks.list.legacy',
		'tasks:tasks.task.tabs',
		'tasks:tasks.task.view',
		'tasks:tasks.task.view-new',
	],
	'extensions' => [
		'apptheme',
		'feature',
		'require-lazy',
		'settings/disabled-tools',
		'layout/ui/info-helper',
		'notify-manager',
	],
];
