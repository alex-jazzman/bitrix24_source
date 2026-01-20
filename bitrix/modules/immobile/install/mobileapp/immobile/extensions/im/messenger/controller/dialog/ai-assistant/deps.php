<?php

return [
	'extensions' => [
		'im:messenger/const',
		'im:messenger/lib/logger',
		'im:messenger/provider/services/analytics',
		'im:messenger/controller/dialog/chat',
		'im:messenger/controller/dialog/lib/helper/text',
		'im:messenger/controller/dialog/lib/message-menu',
		'im:messenger/controller/dialog/lib/notify-panel-manager',
	],
	'bundle' => [
		'./src/dialog',
		'./src/component/message-menu',
	],
];
