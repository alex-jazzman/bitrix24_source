<?php

return [
	'extensions' => [
		'type',
		'assets/icons',
		'utils/object',
		'im:messenger/loc',
		'im:messenger/const',
		'im:messenger/lib/feature',
		'im:messenger/lib/di/service-locator',
		'im:messenger/api/notifications-opener',
		'im:messenger/lib/widget/header-button',
		'im:messenger/lib/read-all-chats',
		'im:messenger/lib/widget/header-button/popup-create-button',
		'im:messenger/controller/recent/manager',
	],
	'bundle' => [
		'./src/button',
		'./src/config',
		'./src/controller',
		'./src/title-controller',
		'./src/buttons-controller',
	],
];
