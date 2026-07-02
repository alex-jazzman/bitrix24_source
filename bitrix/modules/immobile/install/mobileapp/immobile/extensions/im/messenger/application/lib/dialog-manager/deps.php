<?php

return [
	'extensions' => [
		'type',
		'utils/object',
		'im:messenger/const',
		'im:messenger/controller/dialog/ai-assistant',
		'im:messenger/controller/dialog/chat',
		'im:messenger/controller/dialog/copilot',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/feature',
		'im:messenger/lib/helper',
		'im:messenger/lib/integration/tasksmobile/comments/opener',
		'im:messenger/lib/logger',
		'im:messenger/lib/ui/notification',
		'im:messenger/lib/visibility-manager',
		'im:messenger/provider/data',
		'im:messenger/provider/services/chat',
	],
	'bundle' => [
		'./src/manager',
		'./src/nested-strategy/base',
		'./src/nested-strategy/nested-navigation',
		'./src/normalizer',
		'./src/resolver',
	],
];
