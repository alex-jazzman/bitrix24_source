<?php

return [
	'extensions' => [
		'type',
		'im:messenger/const',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
	],
	'bundle' => [
		'./src/default-element',
		'./src/model',
		'./src/validator',
	],
];
