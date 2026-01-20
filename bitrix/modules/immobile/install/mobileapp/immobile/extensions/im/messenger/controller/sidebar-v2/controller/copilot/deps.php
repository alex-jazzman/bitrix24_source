<?php

return [
	'extensions' => [
		'tokens',
		'assets/icons',
		'require-lazy',
		'device/connection',
		'layout/ui/menu',
		'im:messenger/controller/sidebar-v2/controller/base',
		'im:messenger/controller/sidebar-v2/tabs/participants',
		'im:messenger/controller/sidebar-v2/loc',
		'im:messenger/controller/sidebar-v2/const',
		'im:messenger/controller/sidebar-v2/user-actions/chat',
		'im:messenger/controller/sidebar-v2/user-actions/participants',
		'im:messenger/controller/sidebar-v2/ui/primary-button/factory',
		'im:messenger/lib/const',
		'im:messenger/lib/params',
		'im:messenger/lib/promotion',
		'im:messenger/lib/feature',
		'im:messenger/lib/ui/notification',
	],
	'bundle' => [
		'./src/view',
		'./src/permission-manager',
	],
];
