<?php

return [
	'extensions' => [
		'utils/object',
		'im:messenger/lib/logger',
		'im:messenger/lib/feature',
		'im:messenger/lib/counters/tab-counters',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/page-navigation',
		'im:messenger/provider/rest',
	],
	'bundle' => [
		'./src/service',
	],
];
