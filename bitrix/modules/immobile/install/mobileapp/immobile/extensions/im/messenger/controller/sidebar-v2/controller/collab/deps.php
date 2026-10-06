<?php

return [
	'extensions' => [
		'assets/icons',
		'haptics',
		'type',
		'im:messenger/const',
		'im:messenger/controller/sidebar-v2/const',
		'im:messenger/controller/dialog/lib/helper/text',
		'im:messenger/controller/sidebar-v2/controller/base',
		'im:messenger/controller/sidebar-v2/loc',
		'im:messenger/lib/di/service-locator',
		'im:messenger/controller/sidebar-v2/tabs/audio',
		'im:messenger/controller/sidebar-v2/tabs/links',
		'im:messenger/controller/sidebar-v2/tabs/media',
		'im:messenger/controller/sidebar-v2/tabs/participants',
		'im:messenger/controller/sidebar-v2/ui/primary-button/factory',
		'im:messenger/controller/sidebar-v2/user-actions/chat',
		'im:messenger/controller/sidebar-v2/user-actions/participants',
		'im:messenger/controller/sidebar-v2/user-actions/user',
		'im:messenger/lib/feature',
		'im:messenger/lib/ui/notification',
		'tokens',
	],
	'bundle' => [
		'./src/view',
		'./src/permission-manager',
	],
];
