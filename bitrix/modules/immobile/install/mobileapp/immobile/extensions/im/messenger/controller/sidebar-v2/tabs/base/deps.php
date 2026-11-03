<?php

return [
	'extensions' => [
		'layout/ui/menu',
		'layout/ui/loaders/spinner',
		'utils/object',
		'utils/validation',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
		'im:messenger/lib/rest-manager',
		'im:messenger/controller/sidebar-v2/factory',
		'im:messenger/controller/sidebar-v2/loc',
		'im:messenger/lib/di/service-locator',
		'im:messenger/controller/sidebar-v2/controller/base',
		'im:messenger/controller/sidebar-v2/ui/empty-screen',
		'im:messenger/lib/ui/base/loader',
	],
	'bundle' => [
		'./src/content',
		'./src/dummy-content',
		'./src/list-content',
		'./src/list-item-model',
	],
];
