<?php

return [
	'extensions' => [
		'entity-ready',
		'im/messenger/lib/di/service-locator',
		'statemanager/vuex',
		'statemanager/vuex-manager',
		'utils/object',
		'im:messenger/db/connection',
		'im:messenger/db/model-writer',
		'im:messenger/db/repository',
		'im:messenger/db/table-schema',
		'im:messenger/db/update',
		'im:messenger/lib/feature',
		'im:messenger/lib/logger',
		'im:messenger/lib/params',
		'im:messenger/lib/state-manager/vuex-manager/mutation-manager',
		'im:messenger/model',
	],
	'bundle' => [
		'./src/application',
	],
];
