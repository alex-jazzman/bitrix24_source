<?php

return [
	'extensions' => [
		'utils/uuid',
		'im:messenger/const',
		'im:messenger/lib/logger',
	],
	'bundle' => [
		'./src/forward-message-manager',
		'./src/forward-message-operation',
		'./src/result-mapper',
	],
];
