<?php

return [
	'components' => [
		'tasks:tasks.dashboard',
		'tasks:tasks.task.view-new',
	],
	'extensions' => [
		'apptheme',
		'layout/ui/info-helper',
		'notify-manager',
		'require-lazy',
		'settings/disabled-tools',
		'tariff-plan-restriction',
		'tasks:enum',
	],
];
