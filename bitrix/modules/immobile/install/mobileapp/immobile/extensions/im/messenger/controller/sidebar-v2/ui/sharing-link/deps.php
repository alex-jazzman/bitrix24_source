<?php

return [
	'extensions' => [
		'type',
		'tokens',
		'haptics',
		'device/connection',
		'ui-system/popups/popup-menu',
		'ui-system/typography',
		'ui-system/blocks/icon',
		'im:messenger/const',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/helper',
		'im:messenger/lib/feature',
		'im:messenger/lib/logger',
		'im:messenger/lib/ui/notification',
		'im:messenger/lib/permission-manager',
		'im:messenger/model/sidebar',
		'im:messenger/provider/services/sharing-link',
		'im:messenger/controller/sidebar-v2/loc',
	],
	'bundle' => [
		'./src/view',
	],
];
