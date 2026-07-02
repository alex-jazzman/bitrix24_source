<?php

return [
	'extensions' => [
		'type',
		'assets/icons',
		'utils/url',
		'ai/mcp-selector',
		'utils/url',
		'im:messenger/loc',
		'im:messenger/const',
		'im:messenger/lib/logger',
		'im:messenger/lib/feature',
		'im:messenger/lib/ui/notification',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/reasoning',
		'im:messenger/provider/services/analytics',
		'im:messenger/provider/services/chat',
	],
	'bundle' => [
		'./src/const/type',
		'./src/const/buttons',
		'./src/button-managers/mode-menu',
		'./src/button-managers/mcp',
		'./src/button-managers/search-mode',
		'./src/button-managers/agent',
		'./src/button-managers/legacy',
	],
];
