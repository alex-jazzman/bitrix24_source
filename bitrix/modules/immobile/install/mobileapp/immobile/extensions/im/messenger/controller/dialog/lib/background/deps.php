<?php

return [
	'extensions' => [
		'type',
		'im:lib/theme',
		'im:messenger/const',
		'im:messenger/lib/feature',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
	],
	'bundle' => [
		'./src/manager',
		'./src/configuration'
	],
];
