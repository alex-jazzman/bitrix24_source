<?php

return [
	'components' => [
		'calendar:calendar.event.list',
		'livefeed.postform', // for gratitude creation
		'intranet:user.list',
		'tasks:tasks.dashboard',
		// The BI report list of the profile zone: a tab contributed through onProfileTabsCollect is only
		// rendered when its component is known here - prepareTabs keeps no other way in for a native body.
		'biconnector:biconnector.dashboard.list',
	],
	'extensions' => [
		'loc',
		'feature',
		'statemanager/redux/slices/users/selector',
		'statemanager/redux/store',
		'user-profile/common-tab',
		'user-profile/const',
		'user-profile/api',
		'user-profile/analytics',
		'require-lazy',
	],
];
