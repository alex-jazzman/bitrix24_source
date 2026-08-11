<?php

return [
	'extensions' => [
		'type',
		'tokens',
		'im:messenger/const',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
		'im:messenger/loc',
		'im:messenger/provider/services/analytics',
	],
	'bundle' => [
		'./src/manager',
	],
];
