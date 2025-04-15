<?php

return [
	'extensions' => [
		'type',
		'loc',
		'utils/object',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/params',
		'im:messenger/lib/feature',
		'im:chat/dataconverter',
		'im:chat/searchscopes',
	],
	'bundle' => [
		'./src/chat-creator',
	],
];