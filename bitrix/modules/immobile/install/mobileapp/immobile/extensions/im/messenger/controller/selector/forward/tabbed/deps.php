<?php

return [
	'extensions' => [
		'type',
		'utils/url',
		'selector/widget',
		'selector/providers/base',
		'im:messenger/loc',
		'im:messenger/const',
		'im:messenger/lib/logger',
		'im:messenger/lib/rest',
		'im:messenger/lib/helper',
		'im:messenger/lib/permission-manager',
		'im:messenger/lib/chat-search',
		'im:messenger/lib/element/chat-title',
		'im:messenger/lib/element/chat-avatar',
		'im:messenger/lib/di/service-locator',
		'im:messenger/controller/recent/service/server-load/chat',
		'im:messenger/controller/recent/service/server-load/collab',
		'im:messenger/controller/recent/service/server-load/task',
		'im:messenger/controller/recent/service/server-load/channel',
		'im:messenger/controller/recent/service/server-load/copilot',
	],
	'bundle' => [
		'./src/opener',
		'./src/provider',
		'./src/tab-config',
	],
];
