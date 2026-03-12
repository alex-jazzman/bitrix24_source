<?php

return [
	'extensions' => [
		'type',
		'utils/uuid',
		'im:messenger/const',
		'im:messenger/lib/logger',
		'im:messenger/lib/utils',
		'im:messenger/lib/helper',
		'im:messenger/lib/feature',
		'im:messenger/lib/date-formatter',
	],
	'bundle' => [
		'./src/model',
		'./src/normalizer',
		'./src/default-element',
		'./src/search/validator',
		'./src/search/model',
	],
];
