<?php

return [
	'extensions' => [
		'type',
		'utils/object',
		'im:messenger/application/lib/chat-deletion-manager',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/feature',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
		'im:messenger/lib/params',
		'im:messenger/provider/data',
		'im:messenger/provider/pull/base',
		'im:messenger/provider/pull/lib/new-message-manager',
		'im:messenger/provider/pull/lib/recent/chat/update-manager',
	],
];
