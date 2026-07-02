<?php

return [
	'extensions' => [
		'analytics',
		'utils/uuid',
		'im:messenger/const',
		'im:messenger/loc',
		'im:messenger/lib/params',
		'im:messenger/lib/logger',
		'im:messenger/lib/feature',
		'im:messenger/lib/reasoning',
		'im:messenger/lib/converter/ui/message',
		'im:messenger/provider/services/analytics',
		'im:messenger/provider/services/message',
		'im:messenger/controller/dialog/lib/configurator',
		'im:messenger/controller/dialog/chat',
		'im:messenger/controller/dialog/lib/background',
		'im:messenger/controller/dialog/lib/message-menu',
		'im:messenger/controller/dialog/lib/helper/text',
		'im:messenger/controller/dialog/lib/assistant-button-manager',
		'im:messenger/controller/dialog/lib/mention/provider',
		'im:messenger/lib/element/chat-avatar',
		'im:messenger/lib/element/chat-title',
	],
	'bundle' => [
		'./src/dialog',
		'./src/component/mention/manager',
		'./src/component/mention/provider',
	],
];
