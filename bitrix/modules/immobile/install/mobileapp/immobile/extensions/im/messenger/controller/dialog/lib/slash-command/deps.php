<?php

return [
	'extensions' => [
		'type',
		'device/connection',
		'debug/prism',
		'im:messenger/const',
		'im:messenger/loc',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/logger',
		'im:messenger/lib/feature',
		'im:messenger/lib/helper',
		'im:messenger/lib/element/chat-avatar',
		'im:messenger/assets/icon',
		'im:messenger/lib/params',
		'im:messenger/lib/ui/notification',
		'im:messenger/provider/services/chat',
	],
	'bundle' => [
		'./src/provider',
		'./src/manager',
	],
];
