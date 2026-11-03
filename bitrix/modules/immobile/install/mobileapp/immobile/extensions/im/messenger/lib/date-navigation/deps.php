<?php

return [
	'extensions' => [
		'type',
		'im:messenger/const',
		'im:messenger/lib/rest',
	],
	'bundle' => [
		'./src/timezone',
		'./src/date-code',
		'./src/rest',
		'./src/date-navigation-service',
	],
];
