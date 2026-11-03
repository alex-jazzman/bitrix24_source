<?php

return [
	'extensions' => [
		'tokens',
		'ui-system/layout/area',
		'ui-system/layout/area-list',
		'ui-system/layout/box',
		'ui-system/layout/dialog-footer',
		'ui-system/form/buttons/button',
		'ui-system/typography/text',
		'im:messenger/loc',
		'im:messenger/lib/logger',
		'im:messenger/lib/ui/notification',
		'im:messenger/application/lib/forward-message-manager',
	],
	'bundle' => [
		'./src/forward-result',
		'./src/result-view',
	],
];
