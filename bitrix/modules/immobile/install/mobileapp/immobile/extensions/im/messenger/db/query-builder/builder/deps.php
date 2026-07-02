<?php

return [
	'extensions' => [
		'type',
		'im:messenger/db/connection',
		'im:messenger/db/query-builder/compiler',
		'im:messenger/db/query-builder/condition',
		'im:messenger/db/query-builder/result',
		'im:messenger/db/query-builder/utils',
		'im:messenger/db/schema/field',
		'im:messenger/db/schema/schema-ref',
	],
	'bundle' => [
		'./src/schema-ref',
		'./src/select-query-builder',
		'./src/base-insert-query-builder',
		'./src/insert-query-builder',
		'./src/insert-or-replace-query-builder',
		'./src/insert-or-ignore-query-builder',
		'./src/update-query-builder',
		'./src/delete-query-builder',
		'./src/query-factory',
	],
];
