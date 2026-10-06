<?php

return [
	'extensions' => [
		'tokens',
		'assets/icons',
		'ui-system/layout/box',
		'ui-system/blocks/status-block',
		'ui-system/form/buttons',
		'im:messenger/loc',
		'im:messenger/lib/logger',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/ui/notification',
		'im:messenger/provider/services/chat',
	],
	'bundle' => [
		'./src/confirm-widget',
		'./src/workflow',
	],
];
