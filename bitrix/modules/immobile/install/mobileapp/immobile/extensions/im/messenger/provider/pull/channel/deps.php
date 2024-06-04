<?php

return [
	'extensions' => [
		'im:messenger/provider/pull/base',
		'im:messenger/provider/pull/chat',
		'im:messenger/const',
		'im:messenger/provider/pull/lib/recent/channel',
		'im:messenger/lib/counters',
		'im:messenger/lib/params',
		'im:messenger/lib/logger',
	],
	'bundle' => [
		'./src/message',
		'./src/dialog',
		'./src/file',
	],
];