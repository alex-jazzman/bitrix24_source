<?php

return [
	'extensions' => [
		'im:messenger/const',
		'im:messenger/lib/date-formatter',
		'im:messenger/lib/feature',
		'im:messenger/lib/permission-manager',
		'im:messenger/lib/open-chat-create',
		'im:messenger/controller/recent/service/*',
		'im:messenger/controller/recent/const/service',
	],
	'bundle' => [
		'./src/channel',
		'./src/chats',
		'./src/collab',
		'./src/copilot',
		'./src/dummy',
		'./src/openlines',
		'./src/task',
	],
];
