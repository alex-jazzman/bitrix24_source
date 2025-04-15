<?php

return [
	'extensions' => [
		'type',
		'utils/date',
		'im:messenger/const',
		'im:messenger/lib/logger',
		'im:messenger/lib/params',
	],
	'bundle' => [
		'./src/model',
		'./src/default-element',
		'./src/files/model',
		'./src/files/validator',
		'./src/files/default-element',
		'./src/links/model',
		'./src/links/validator',
		'./src/links/default-element',
	],
];