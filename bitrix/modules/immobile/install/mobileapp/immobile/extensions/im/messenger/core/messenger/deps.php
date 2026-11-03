<?php

return [
	'extensions' => [
		'im:messenger/const',
		'im:messenger/core/base',
		'im:messenger/lib/di/service-locator',
		'im:messenger/model',
		'entity-ready',
	],
	'bundle' => [
		'./src/core',
	],
];
