<?php

return [
	'extensions' => [
		'apptheme',
		'type',
		'loc',
		'module',
		'ui-system/blocks/icon',
		'im:messenger/const',
		'im:messenger/params',
		'im:messenger/view/base',
		'im:messenger/view/lib/proxy-view',
		'im:messenger/lib/logger',
		'im:messenger/lib/visibility-manager',
		'im:messenger/lib/feature',
		'im:messenger/lib/di/service-locator',
		'im:messenger/provider/service/analytics',
	],
	'bundle' => [
		'./src/dialog',
		'./src/text-field',
		'./src/status-field',
		'./src/mention-panel',
		'./src/pin-panel',
		'./src/action-panel',
		'./src/comments-button',
		'./src/join-button',
		'./src/selector',
		'./src/restrictions',
	],
];
