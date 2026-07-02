<?php

return [
	'extensions' => [
		'type',
		'im:messenger/db/const',
		'im:messenger/db/query-builder/condition',
		'im:messenger/db/schema/field',
		'im:messenger/db/query-builder/order',
		'im:messenger/db/query-builder/utils',
	],
	'bundle' => [
		'./src/condition-compiler',
		'./src/order-compiler',
		'./src/helpers',
		'./src/schema-compiler',
	],
];
