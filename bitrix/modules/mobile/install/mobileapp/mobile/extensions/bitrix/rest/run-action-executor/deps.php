<?php

return [
	'extensions' => [
		'rest/transport',
		'type',
		'utils/function',
		'utils/object',
		// ./cache reads Application.storage, and utils/storage is what installs it.
		'utils/storage', //@keep
		'utils/logger',
	],
	'bundle' => [
		'./cache',
		'./src/request-manager',
	],
];
