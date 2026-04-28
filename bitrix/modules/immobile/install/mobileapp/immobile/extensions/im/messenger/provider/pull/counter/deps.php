<?php

return [
	'extensions' => [
		'type',
		'im:messenger/const',
		'im:messenger/lib/counters/update-system/action/delete-message/pull',
		'im:messenger/lib/counters/update-system/action/new-message/pull',
		'im:messenger/lib/counters/update-system/action/read-message/server',
		'im:messenger/lib/counters/update-system/action/read-message/pull',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
		'im:messenger/lib/uuid-manager',
		'im:messenger/provider/pull/base',
	],
];
