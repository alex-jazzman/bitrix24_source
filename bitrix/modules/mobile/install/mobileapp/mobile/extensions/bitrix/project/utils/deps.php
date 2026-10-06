<?php

return [
	'components' => [
		'calendar:calendar.event.list',
		'project.tabs',
		'disk:disk.tabs.group',
		'tasks:tasks.dashboard',
	],
	'extensions' => [
		'collab/service/access',
		'loc',
		'notify-manager',
		'qrauth/utils',
		'rest',
		'tariff-plan-restriction',
		'tokens',
		'toast',
		'ui-system/blocks/avatar',
		'utils/guid',
		'utils/url',
	],
];
