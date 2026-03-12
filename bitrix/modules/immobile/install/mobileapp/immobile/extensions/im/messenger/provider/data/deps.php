<?php

return [
	'extensions' => [
		'type',
		'utils/object',
		'im:messenger/lib/di/service-locator',
		'im:messenger/lib/logger',
		'im:messenger/model/dialogues',
	],
	'bundle' => [
		'./src/base',
		'./src/chat',
		'./src/chat/deleter',
		'./src/chat/entity-updater',
		'./src/chat/getter',
		'./src/message',
		'./src/message/deleter',
		'./src/reaction',
		'./src/reaction/deleter',
		'./src/reaction/setter',
		'./src/recent',
		'./src/recent/deleter',
		'./src/result',
		'./src/sticker',
	],
];
