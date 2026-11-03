<?php

return [
	'extensions' => [
		'type',
		'tokens',
		'im:messenger/const',
		'im:messenger/controller/recent/service/empty-state/lib/welcome-screen/copilot/greeting-selector',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
		'im:messenger/lib/params',
		'im:messenger/loc',
		'im:messenger/provider/services/analytics',
	],
	'bundle' => [
		'./src/manager',
	],
];
