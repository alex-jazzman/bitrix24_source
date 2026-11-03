<?php

return [
	'extensions' => [
		'type',
		'utils/array',
		'utils/function',
		'im:messenger/const',
		'im:messenger/lib/di/service-locator',
		'im:messenger/model/recent',
		'im:messenger/controller/recent/service/base',
		'im:messenger/controller/recent/service/vuex/lib/handlers/anchor',
		'im:messenger/controller/recent/service/vuex/lib/sync/filter',
		'im:messenger/controller/recent/service/lib/folder-composition',
	],
];
