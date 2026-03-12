<?php

return [
	'extensions' => [
		'type',
		'im:messenger/const',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/feature',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
		'im:messenger/lib/rest',
		'im:messenger/lib/utils',
		'im:messenger/provider/data',
		'im:messenger/provider/services/sync/fillers/base',
		'im:messenger/provider/services/sync/fillers/database',
	],
	'bundle' => [
		'./src/filler',
		'./src/fillers/store',
		'./src/loader',
		'./src/service',
		'../../../../messenger/provider/services/sync/service/src/date',
	],
];
