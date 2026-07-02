<?php

return [
	'extensions' => [
		'require-lazy',
		'selector/widget/entity/socialnetwork/user',
		'type',
		'utils/array',
		'im:messenger/const',
		'im:messenger/controller/selector/member',
		'im:messenger/lib/emitter',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
		'im:messenger/lib/rest',
		'im:messenger/loc',
		'im:messenger/provider/services/analytics',
		'im:messenger/provider/services/chat',
	],
	'bundle' => [
		'./src/rest-service',
	],
];
