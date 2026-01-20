<?php

return [
	'extensions' => [
		'type',
		'assets/icons',
		'ai/mcp-selector',
		'im:messenger/loc',
		'im:messenger/const',
		'im:messenger/lib/logger',
		'im:messenger/lib/feature',
		'im:messenger/lib/ui/notification',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/reasoning',
		'im:messenger/provider/services/analytics',
	],
	'bundle' => [
		'./src/const/type',
		'./src/const/buttons',
	],
];
