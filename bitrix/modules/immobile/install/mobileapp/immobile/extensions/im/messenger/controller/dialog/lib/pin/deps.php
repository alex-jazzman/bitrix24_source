<?php

return [
	'extensions' => [
		'device/connection',
		'tokens',
		'type',
		'utils/array',
		'utils/object',
		'im:messenger/const',
		'im:messenger/lib/date-formatter',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/element/chat-avatar',
		'im:messenger/lib/element/chat-title',
		'im:messenger/lib/feature',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
		'im:messenger/lib/params',
		'im:messenger/lib/parser',
		'im:messenger/lib/permission-manager',
		'im:messenger/lib/ui/notification',
		'im:messenger/loc',
		'im:messenger/provider/services/analytics',
	],
	'bundle' => [
		'./src/list',
		'./src/list-item',
		'./src/manager',
	],
];
