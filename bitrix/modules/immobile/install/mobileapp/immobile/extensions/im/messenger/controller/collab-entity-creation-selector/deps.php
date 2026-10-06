<?php

return [
	'extensions' => [
		'tokens',
		'type',
		'ui-system/layout/area',
		'ui-system/typography',
		'utils/page-manager',
		'im:messenger/assets/icon',
		'im:messenger/const',
		'im:messenger/controller/chat-composer',
		'im:messenger/controller/dialog-creator',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/logger',
		'im:messenger/lib/ui/notification',
		'im:messenger/lib/feature',
		'im:messenger/lib/permission-manager',
		'im:messenger/loc',
		'im:messenger/controller/attach-chat/flow',
		'im:messenger/provider/services/chat',
	],
	'bundle' => [
		'./src/backdrop-height',
		'./src/controller',
		'./src/selector',
	],
];
