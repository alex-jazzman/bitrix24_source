<?php

return [
	'extensions' => [
		'tokens',
		'utils/array',
		'utils/date',
		'utils/file',
		'utils/validation',
		'utils/date/formats',
		'utils/date/moment',
		'im:messenger/assets',
		'im:messenger/const',
		'im:messenger/controller/sidebar-v2/const',
		'im:messenger/controller/sidebar-v2/loc',
		'im:messenger/controller/dialog/lib/media-gallery',
		'im:messenger/controller/sidebar-v2/services/file-service',
		'im:messenger/controller/sidebar-v2/tabs/base',
		'im:messenger/controller/sidebar-v2/tabs/files',
		'im:messenger/controller/sidebar-v2/tabs/base/src/content',
	],
	'bundle' => [
		'./src/content',
		'./src/items/model',
	],
];
