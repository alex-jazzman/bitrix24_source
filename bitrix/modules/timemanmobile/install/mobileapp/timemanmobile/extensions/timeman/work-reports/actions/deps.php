<?php

return [
	'extensions' => [
		'im:messenger/api/dialog-opener',
		'timeman:work-reports/api',
		'timeman:work-reports/loc',
		'timeman:work-reports/utils',
		'statemanager/redux/slices/users',
		'statemanager/redux/store',
		'timeman:selector/entity/full-report-user',
	],
	'bundle' => [
		'./src/discuss-chat',
		'./src/month-picker',
		'./src/user-selector',
	],
];
