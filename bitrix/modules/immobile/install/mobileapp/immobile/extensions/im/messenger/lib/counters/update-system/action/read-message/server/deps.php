<?php

return [
	'extensions' => [
		'type',
		'im:messenger/lib/counters/update-system/action/base',
		'im:messenger/lib/counters/update-system/conflict/resolver',
		'im:messenger/lib/counters/update-system/conflict/strategy',
		'im:messenger/lib/counters/update-system/const',
	],
	'bundle' => [
		'./src/confirmation',
		'./src/error',
	],
];
