<?php

return [
	'components' => [
		'calendar:calendar.event.list',
		'livefeed.postform', // for gratitude creation
		'intranet:user.list',
		'tasks:tasks.dashboard',
	],
	'extensions' => [
		'loc',
		'statemanager/redux/slices/users/selector',
		'statemanager/redux/store',
		'user-profile/common-tab',
		'user-profile/const',
		'user-profile/api',
		'user-profile/analytics',
		'require-lazy',
	],
];
