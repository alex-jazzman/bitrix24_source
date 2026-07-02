<?php

return [
	'extensions' => [
		'im:messenger/db/const',
		'im:messenger/db/query-builder/condition',
		'im:messenger/db/query-builder/order',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
	],
	'bundle' => [
		'./src/alias',
		'./src/base',
		'./src/scalar',
		'./src/ordered',
		'./src/integer',
		'./src/string',
		'./src/boolean',
		'./src/date',
		'./src/structured',
		'./src/object',
		'./src/array',
		'./src/map',
		'./src/set',
		'./src/expression',
	],
];
