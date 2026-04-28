<?php

return [
	'extensions' => [
		'type',
		'device/connection',
		'assets/icons',
		'im:messenger/const',
		'im:messenger/loc',
		'im:messenger/lib/date-formatter',
		'im:messenger/lib/feature',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
		'im:messenger/lib/params',
		'im:messenger/lib/rest',
		'im:messenger/lib/chat-search',
		'im:messenger/lib/emitter',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/permission-manager',
		'im:messenger/provider/services/chat',
		'im:messenger/provider/services/analytics',
		'im:messenger/lib/element/chat-avatar',
		'im:messenger/lib/element/chat-title',
	],
	'bundle' => [
		'./src/config',
		'./src/manager',
		'./src/provider',
	],
];
