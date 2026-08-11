<?php

return [
	'extensions' => [
		'assets/icons',
		'type',
		'utils/object',
		'im:messenger/api/notifications-opener',
		'im:messenger/const',
		'im:messenger/controller/recent/manager',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/element/chat-avatar',
		'im:messenger/lib/feature',
		'im:messenger/lib/integration/mobile/vibecode',
		'im:messenger/lib/read-all-chats',
		'im:messenger/lib/popup-menu/recent-actions',
		'im:messenger/lib/ui/notification',
		'im:messenger/lib/widget/header-button',
		'im:messenger/lib/widget/header-button/popup-create-button',
		'im:messenger/loc',
	],
	'bundle' => [
		'./src/button',
		'./src/buttons-controller',
		'./src/config',
		'./src/configurator',
		'./src/controller',
		'./src/manager',
		'./src/title-controller',
		'./src/title-params-provider/global',
		'./src/title-params-provider/nested',
	],
];
