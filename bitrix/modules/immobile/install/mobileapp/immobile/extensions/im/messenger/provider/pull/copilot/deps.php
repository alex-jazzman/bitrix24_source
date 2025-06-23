<?php

return [
	'extensions' => [
		'type',
		'loc',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
		'im:messenger/lib/counters/tab-counters',
		'im:messenger/lib/parser',
		'im:messenger/lib/emitter',
		'im:messenger/lib/uuid-manager',
		'im:messenger/cache/share-dialog',
		'im:messenger/provider/service/sync',
		'im:messenger/provider/pull/chat',
		'im:messenger/provider/pull/chat/dialog',
		'im:messenger/provider/pull/lib/new-message-manager/copilot',
		'im:chat/utils',
		'im:chat/messengercommon',
	],
	'bundle' => [
		'./src/dialog',
		'./src/message',
		'./src/file',
		'./src/user',
		'./src/counter',
	],
];
