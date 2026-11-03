<?php

return [
	'extensions' => [
		'type',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/feature',
		'im:messenger/lib/params',
	],
	'bundle' => [
		'./src/user-permission',
		'./src/chat-permission',
	],
];
