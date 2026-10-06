<?php

return [
	'extensions' => [
		'im:messenger/const',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
		'im:messenger/lib/rest',
		'im:messenger/model/sidebar',
	],
	'bundle' => [
		'./src/service',
	],
];
