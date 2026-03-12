<?php

return [
	'components' => [
		'project.tabs',
		'tasks:tasks.dashboard',
		'disk:disk.tabs.group',
	],
	'extensions' => [
		'notify-manager',
		'qrauth/utils',
		'require-lazy',
		'rest',
		'tariff-plan-restriction',
		'toast',
		'collab/service/access',
	],
];
