<?php

return [
	'extensions' => [
		'type',
		'toast',
		'tokens',
		'assets/icons',
		'ui-system/popups/aha-moment',
		'im:messenger/loc',
		'im:messenger/lib/feature',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/project-access-guard',
		'im:messenger/provider/services/chat',
		'im:messenger/provider/services/analytics',
		'im:messenger/controller/dialog/lib/mention',
	],
	'bundle' => [
		'./src/manager',
	],
];
