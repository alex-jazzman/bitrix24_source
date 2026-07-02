<?php

return [
	'extensions' => [
		'im:messenger/db/const',
		'im:messenger/db/schema/base-schema',
		'im:messenger/db/schema/field',
		'im:messenger/db/schema/index',
		'im:messenger/lib/helper',
		'type',
	],
	'bundle' => [
		'./src/dialog',
		'./src/draft',
		'./src/folder',
		'./src/folder-chat',
		'./src/recent',
	],
];
