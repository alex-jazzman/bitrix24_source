<?php

return [
	'extensions' => [
		'loc',
		'utils/file',
		'tokens',
		'layout/ui/context-menu',
		'ui-system/typography',
		'ui-system/blocks/icon',
		'im:messenger/const',
		'im:messenger/lib/logger',
		'im:messenger/provider/services/disk',
		'im:messenger/lib/ui/notification',
		'im:messenger/lib/di/service-locator',
	],
	'bundle' => [
		'./src/file-download',
		'./src/server-download',
	],
];
