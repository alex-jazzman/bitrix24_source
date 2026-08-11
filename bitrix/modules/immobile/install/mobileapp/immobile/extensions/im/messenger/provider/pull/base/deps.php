<?php

return [
	'extensions' => [
		'type',
		'im:messenger/const',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/emitter',
		'im:messenger/lib/logger',
		'im:messenger/provider/services/sync',
	],
	'bundle' => [
		'./src/pull-handler',
		'./src/application',
	],
];
