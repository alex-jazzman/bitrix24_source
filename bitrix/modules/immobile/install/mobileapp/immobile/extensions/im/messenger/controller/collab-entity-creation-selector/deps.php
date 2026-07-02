<?php

return [
	'extensions' => [
		'tokens',
		'type',
		'ui-system/layout/area',
		'ui-system/typography',
		'im:messenger/assets/icon',
		'im:messenger/controller/chat-composer',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/logger',
		'im:messenger/lib/ui/notification',
		'im:messenger/loc',
	],
	'bundle' => [
		'./src/controller',
		'./src/selector',
	],
];
