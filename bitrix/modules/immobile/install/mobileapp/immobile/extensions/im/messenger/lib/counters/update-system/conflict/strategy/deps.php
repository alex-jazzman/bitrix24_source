<?php

return [
	'extensions' => [
		'type',
		'im:messenger/const',
		'im:messenger/lib/counters/update-system/const',
	],
	'bundle' => [
		'./src/base',
		'./src/delete-message/delete-message',
		'./src/new-message/after-local-read',
		'./src/read-confirmation/only-local-read',
		'./src/read-confirmation/with-mixed-operations',
		'./src/read-confirmation/with-new-message',
		'./src/read-message-pull/strategy',
		'./src/server-win',
	],
];
