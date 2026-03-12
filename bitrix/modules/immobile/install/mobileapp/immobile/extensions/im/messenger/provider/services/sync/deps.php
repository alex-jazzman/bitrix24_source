<?php

return [
	'extensions' => [
		'type',
		'utils/object',
		'im:messenger/const',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/user-manager',
		'im:messenger/provider/services/lib/message-context-creator',
		'im:messenger/lib/feature',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
		'im:messenger/lib/emitter',
		'im:messenger/lib/rest',
		'im:messenger/lib/utils',
		'im:messenger/provider/data',
	],
	'bundle' => [
		'./src/filler',
		'./src/fillers/base',
		'./src/fillers/database',
		'./src/fillers/store',
		'./src/loader',
		'./src/service',
		'./src/date-service',
	],
];
