<?php

return [
	'extensions' => [
		'type',
		'im:messenger/const',
		'im:messenger/lib/logger',
		'im:messenger/lib/helper',
		'im:messenger/lib/feature',
	],
	'bundle' => [
		'./src/model',
		'./src/validator',
		'./src/default-element',
	],
];