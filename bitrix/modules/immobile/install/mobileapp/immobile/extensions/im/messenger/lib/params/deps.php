<?php

return [
	'extensions' => [
		'type',
		'native/memorystore',
		'entity-ready',
		'im:messenger/const',
		'im:messenger/lib/logger',
	],
	'bundle' => [
		'./src/shared-storage',
		'./src/writer',
		'./src/reader',
	],
];
