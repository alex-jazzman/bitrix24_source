<?php

return [
	'extensions' => [
		'im:messenger/const',
		'im:messenger/lib/logger',
		'im:messenger/lib/feature',
		'im:messenger/provider/services/analytics',
		'im:messenger/controller/dialog/chat',
		'im:messenger/controller/dialog/lib/helper/text',
		'im:messenger/controller/dialog/lib/notify-panel-manager',
		'im:messenger/controller/dialog/lib/assistant-button-manager',
	],
	'bundle' => [
		'./src/dialog',
	],
];
