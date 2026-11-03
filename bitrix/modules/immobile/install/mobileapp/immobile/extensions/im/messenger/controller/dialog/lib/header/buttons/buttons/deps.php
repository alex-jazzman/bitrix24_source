<?php

return [
	'extensions' => [
		'assets/icons',
		'debug/prism',
		'device/connection',
		'require-lazy',
		'type',
		'im:lib/theme',
		'im:messenger/const',
		'im:messenger/controller/user-add',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/feature',
		'im:messenger/lib/helper',
		'im:messenger/lib/integration/callmobile/call-manager',
		'im:messenger/lib/integration/immobile/calls',
		'im:messenger/lib/logger',
		'im:messenger/lib/permission-manager',
		'im:messenger/lib/ui/notification',
		'im:messenger/loc',
		'im:messenger/provider/services/analytics',
	],
	'bundle' => [
		'./src/button-configuration',
		'./src/buttons',
	],
];
