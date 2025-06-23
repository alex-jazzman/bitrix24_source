<?php

return [
	'components' => [
		'apprating.box',
	],
	'extensions' => [
		'tourist',
		'layout/ui/app-rating',
		'bizproc:task/task-constants',
		'feature',
		'module',
	],
	'bundle' => [
		'./src/event-listener',
	],
];