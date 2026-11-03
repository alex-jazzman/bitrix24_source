<?php
return [
	'extensions' => [
		'in-app-url/widget-presenter',
		'rest/transport',
		'require-lazy',
	],
	'bundle' => [
		'./src/tasks',
		'./src/terminal',
		'./src/check-in',
		'./src/calendar',
	]
];
