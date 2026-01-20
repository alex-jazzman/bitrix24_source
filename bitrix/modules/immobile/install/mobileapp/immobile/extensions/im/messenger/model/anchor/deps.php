<?php

return [
	'extensions' => [
		'type',
		'utils/object',
		'im:messenger/const',
		'im:messenger/lib/logger',
	],
	'bundle' => [
		'./src/model',
		'./src/validator',
		'./src/default-element',
	],
];
