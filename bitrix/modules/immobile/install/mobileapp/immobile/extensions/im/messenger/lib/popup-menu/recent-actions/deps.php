<?php

return [
	'extensions' => [
		'type',
		'tokens',
		'assets/icons',
		'ui-system/popups/popup-menu',
		'im:messenger/loc',
		'im:messenger/const',
		'im:messenger/lib/feature',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/read-all-chats',
		'im:messenger/lib/ui/notification',
		'im:messenger/lib/logger',
		'im:messenger/model/folder',
		'im:messenger/controller/folder/list',
		'im:messenger/controller/folder/update',
		'im:messenger/controller/folder/lib/actions',
		'im:messenger/provider/services/analytics',
	],
	'bundle' => [
		'./src/recent-actions-menu',
		'./src/nested-recent-actions-menu',
	],
];
