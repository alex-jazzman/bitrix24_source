<?php

return [
	'extensions' => [
		'utils/function',
		'utils/storage',
		'utils/logger',
		'storage-cache',
	],
	'bundle' => [
		'./cache',
		'./src/request-manager',
	],
];
