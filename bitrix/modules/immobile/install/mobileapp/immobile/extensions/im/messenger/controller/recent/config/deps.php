<?php

return [
	'extensions' => [
		'im:messenger/const',
		'im:messenger/lib/date-formatter',
		'im:messenger/lib/feature',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/permission-manager',
		'im:messenger/lib/open-chat-create',
		'im:messenger/lib/ui/notification',
		'im:messenger/controller/recent/service/*',
		'im:messenger/controller/recent/const',
		'im:messenger/controller/dialog-creator',
		'im:messenger/provider/services/chat',
	],
	'bundle' => [
		'./src/dummy',
		// global
		'./src/global/channel',
		'./src/global/chats',
		'./src/global/collab',
		'./src/global/copilot',
		'./src/global/folder',
		'./src/global/openlines',
		'./src/global/task',
		// nested
		'./src/nested/calendar',
		'./src/nested/collab-chat',
		'./src/nested/collab-copilot',
		'./src/nested/collab-default',
		'./src/nested/tasks-tasks',
	],
];
