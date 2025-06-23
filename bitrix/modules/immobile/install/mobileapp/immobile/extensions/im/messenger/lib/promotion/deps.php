<?php

return [
	'extensions' => [
		'tokens',
		'ui-system/blocks/icon',
		'im:messenger/lib/rest-manager',
		'im:messenger/lib/logger',
		'im:messenger/const',
		'im:messenger/provider/rest',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/feature',
		'im:messenger/assets/promotion'
	],
	'bundle' => [
		'./src/copilot-view',
	],
];
