<?php

return [
	'extensions' => [
		'type',
		'im:messenger/const',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/emitter',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
		'im:messenger/provider/data',
	],
	'bundle' => [
		'./src/const',
		'./src/snapshot',
		'./src/announcer',
		'./src/manager',
	],
];
