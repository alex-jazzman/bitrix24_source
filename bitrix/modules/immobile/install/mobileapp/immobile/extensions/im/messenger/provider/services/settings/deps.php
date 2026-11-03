<?php

return [
	'extensions' => [
		'type',
		'assets/icons',
		'im:messenger/const',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/logger',
		'im:messenger/lib/rest',
		'im:messenger/loc',
		'im:messenger/lib/ui/notification',
	],
	'bundle' => [
		'./src/default-reaction',
		'./src/default-reaction-policy',
	],
];
