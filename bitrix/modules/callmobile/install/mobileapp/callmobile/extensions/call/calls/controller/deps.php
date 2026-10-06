<?php

return [
	'extensions' => [
		'analytics',
		'call:const',
		'call:calls/engine',
		'call:calls/plain',
		'call:calls/menu',
		'call:calls/stuck-call-finish-tracker',
		'src/is-room-closed-error',
		'im:messenger/lib/ui/notification',
		'loc',
	],
	'bundle' => [
		'./connection-error-status',
		'./call-id-analytics-param',
	],
];
