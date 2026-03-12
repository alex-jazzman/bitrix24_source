<?php

return [
	'extensions' => [
		'type',
		'utils/object',
		'im:messenger/const',
		'im:messenger/lib/logger',
		'im:messenger/lib/rest',
		'im:messenger/lib/utils',
		'im:messenger/lib/helper',
		'im:messenger/lib/uuid-manager',
		'im:messenger/lib/di/service-locator',
	],
	'bundle' => [
		'./src/read-message-queue',
		'./src/service',
		'./src/store-writer',
	],
];