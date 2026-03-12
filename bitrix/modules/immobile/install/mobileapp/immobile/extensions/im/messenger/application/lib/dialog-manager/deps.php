<?php

return [
	'extensions' => [
		'type',
		'utils/object',
		'im:messenger/const',
		'im:messenger/lib/helper',
		'im:messenger/controller/dialog/chat',
		'im:messenger/controller/dialog/copilot',
		'im:messenger/controller/dialog/ai-assistant',
		'im:messenger/lib/logger',
		'im:messenger/lib/visibility-manager',
		'im:messenger/lib/integration/tasksmobile/comments/opener',
		'im:messenger/lib/ui/notification',
		'im:messenger/provider/data',
		'im:messenger/provider/services/chat',
		'im:messenger/lib/di/service-locator',
	],
	'bundle' => [
		'./src/manager',
		'./src/resolver',
		'./src/normalizer',
		'./src/service',
	],
];
