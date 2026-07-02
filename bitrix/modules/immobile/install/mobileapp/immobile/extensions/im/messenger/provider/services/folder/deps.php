<?php

return [
	'extensions' => [
		'type',
		'im:messenger/const',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/logger',
		'im:messenger/lib/rest',
		'im:messenger/lib/rest-manager',
		'im:messenger/model/folder',
		'im:messenger/provider/data',
	],
	'bundle' => [
		'./src/service',
	],
];
