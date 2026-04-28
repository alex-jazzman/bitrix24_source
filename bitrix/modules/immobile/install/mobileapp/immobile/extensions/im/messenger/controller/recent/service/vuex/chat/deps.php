<?php

return [
	'extensions' => [
		'type',
		'utils/array',
		'im:messenger/const',
		'im:messenger/lib/di/service-locator',
		'im:messenger/controller/messenger-header',
		'im:messenger/controller/recent/service/base',
		'im:messenger/controller/recent/service/vuex/lib/handlers/anchor',
		'im:messenger/controller/recent/service/vuex/lib/handlers/counter',
		'im:messenger/controller/recent/service/vuex/lib/sync/filter',
	],
];
