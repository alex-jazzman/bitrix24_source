<?php

return [
	'extensions' => [
		'type',
		'ui-system/popups/aha-moment',
		'im:messenger/loc',
		'im:messenger/const',
		'im:messenger/logger',
		'im:messenger/provider/rest',
		'im:messenger/assets/promotion',
		'im:messenger/lib/di/service-locator',
	],
	'bundle' => [
		'./src/promotion',
		'./src/trigger-manager',
		'./src/entities/video-note',
		'./src/entities/copilot',
		'./src/entities/tasks',
	],
];
