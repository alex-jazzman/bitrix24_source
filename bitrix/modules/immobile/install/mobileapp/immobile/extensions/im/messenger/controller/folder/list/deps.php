<?php

return [
	'extensions' => [
		'device/connection',
		'tokens',
		'haptics',
		'ui-system/blocks/icon',
		'ui-system/popups/popup-menu',
		'ui-system/form/buttons/button',
		'im:lib/theme',
		'im:messenger/loc',
		'im:messenger/const',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/logger',
		'im:messenger/lib/ui/notification',
		'im:messenger/controller/folder/create',
		'im:messenger/controller/folder/update',
		'im:messenger/controller/folder/lib/ui/loadable-button',
		'im:messenger/controller/folder/lib/actions',
		'im:messenger/provider/services/analytics',
	],
	'bundle' => [
		'./src/card',
		'./src/view',
	],
];
