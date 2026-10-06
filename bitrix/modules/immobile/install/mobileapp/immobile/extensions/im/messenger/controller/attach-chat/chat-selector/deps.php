<?php

return [
	'extensions' => [
		'type',
		'selector/widget',
		'selector/providers/base',
		'im:messenger/loc',
		'im:messenger/const',
		'im:messenger/assets/icon',
		'im:messenger/lib/logger',
		'im:messenger/lib/rest',
		'im:messenger/lib/permission-manager',
		'im:messenger/lib/chat-search',
		'im:messenger/lib/element/chat-title',
		'im:messenger/lib/element/chat-avatar',
		'im:messenger/lib/di/service-locator',
		'im:messenger/controller/recent/service/server-load/chat',
	],
	'bundle' => [
		'./src/opener',
		'./src/provider',
	],
];
