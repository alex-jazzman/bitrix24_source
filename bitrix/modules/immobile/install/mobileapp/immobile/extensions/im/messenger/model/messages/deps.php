<?php

return [
	'extensions' => [
		'type',
		'utils/uuid',
		'utils/object',
		'im:messenger/lib/logger',
		'im:messenger/lib/utils',
		'im:messenger/lib/helper',
		'im:messenger/lib/feature',
		'im:messenger/const',
		'im:messenger/lib/params',
		'im:messenger/lib/reaction-assets-manager',
		'im:messenger/lib/state-manager/vuex-manager/mutation-handlers-waiter',
		'utils/url',
	],
	'bundle' => [
		'./src/model',
		'./src/validator',
		'./src/default-element',
		'./src/pin/model',
		'./src/pin/validator',
		'./src/reactions/model',
		'./src/reactions/default-element',
		'./src/vote/model',
		'./src/vote/default-element',
		'./src/vote/validator',
	],
];
