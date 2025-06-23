<?php

return [
	'extensions' => [
		'im:messenger/controller/sidebar-v2/loc',
		'im:messenger/controller/sidebar-v2/tabs/base',
		'im:messenger/controller/sidebar-v2/services/file-service',
		'im:messenger/controller/sidebar-v2/const',
		'im:messenger/controller/sidebar-v2/tabs/files',
		'im:messenger/controller/sidebar-v2/tabs/base/src/content',
		'im:messenger/const',
		'utils/date/moment',
		'utils/date/formats',
		'utils/file',
		'utils/validation',
		'tokens',
	],
	'bundle' => [
		'./src/content',
		'./src/items/model',
	],
];
