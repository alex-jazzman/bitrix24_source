<?php

return [
	'extensions' => [
		'analytics',
		'calendar:entry',
		'qrauth/utils',
		'require-lazy',
		'rest/run-action-executor',
		'sign:entry',
		'stafftrack:entry',
		'tokens',
		'utils/function',
		'whats-new/ui-manager/component-opener',
		'user-profile',
		'statemanager/redux/store',
		'statemanager/redux/slices/users/selector',
		'utils/url',
		'layout/ui/user/empty-avatar',
	],
	'bundle' => [
		'./src/calendar',
		'./src/check-in',
		'./src/sign',
	],
];
