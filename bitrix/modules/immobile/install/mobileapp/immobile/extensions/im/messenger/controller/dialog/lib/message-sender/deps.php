<?php

return [
	'extensions' => [
		'type',
		'utils/object',
		'utils/uuid',
		'im:messenger/const',
		'im:messenger/controller/dialog/lib/app-rating-client',
		'im:messenger/lib/converter/data/recent',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
		'im:messenger/lib/params',
		'im:messenger/lib/utils',
		'im:messenger/provider/rest',
		'im:messenger/provider/services/sending',
	],
	'bundle' => [
		'./src/event-handler',
		'./src/forwarding-message-builder',
		'./src/outgoing-message-builder',
		'./src/preparer',
		'./src/recent-message-updater',
	],
];
