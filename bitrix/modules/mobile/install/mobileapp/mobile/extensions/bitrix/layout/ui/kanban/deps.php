<?php

return [
	'extensions' => [
		'layout/ui/kanban/*',
		'layout/ui/loading-screen',
		'layout/ui/stateful-list',
		'loc',
		'utils',
		'utils/error-notifier',
		'utils/object',

		'crm:required-fields',
		'crm:storage/category',
	],
	'bundle' => [
		'./refs-container',
	],
];
