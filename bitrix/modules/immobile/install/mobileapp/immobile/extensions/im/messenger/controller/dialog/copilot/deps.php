<?php

return [
	'extensions' => [
		'utils/uuid',
		'im:messenger/const',
		'im:messenger/lib/params',
		'im:messenger/lib/logger',
		'im:messenger/provider/service',
		'im:messenger/controller/dialog/chat',
		'im:messenger/controller/dialog/lib/message-menu',
		'im:messenger/controller/dialog/lib/helper/text',
	],
	'bundle' => [
		'./src/dialog',
		'./src/component/message-menu',
		'./src/component/mention/manager',
	],
];