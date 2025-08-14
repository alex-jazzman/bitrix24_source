<?php

return [
	'extensions' => [
		'type',
		'utils/object',
		'utils/array',
		'device/connection',
		'im:messenger/loc',
		'im:messenger/lib/feature',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/parser',
		'im:messenger/lib/params',
		'im:messenger/lib/logger',
		'im:messenger/lib/ui/notification',
		'im:messenger/lib/helper',
		'im:messenger/lib/permission-manager',
	],
	'bundle' => [
		'./src/list',
		'./src/list-item',
		'./src/manager',
	],
];
