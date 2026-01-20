<?php

return [
	'extensions' => [
		'type',
		'im:messenger/const',
		'im:messenger/loc',
		'im:messenger/lib/date-formatter',
		'im:messenger/lib/feature',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
		'im:messenger/lib/params',
		'im:messenger/lib/rest',
		'im:messenger/controller/search/experimental',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/element/chat-avatar',
		'im:messenger/lib/element/chat-title',
	],
	'bundle' => [
		'./src/config',
		'./src/manager',
		'./src/provider',
	],
];
