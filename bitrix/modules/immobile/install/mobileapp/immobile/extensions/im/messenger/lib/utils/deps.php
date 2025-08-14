<?php

return [
	'extensions' => [
		'type',
		'utils/date',
		'utils/date/formats',
		'layout/ui/friendly-date/time-ago-format',
		'im:messenger/loc',
		'im:messenger/lib/date-formatter',
	],
	'bundle' => [
		'./src/user',
		'./src/date',
		'./src/object',
		'./src/color',
		'./src/emoji-regex',
		'./src/promise',
		'./src/async-queue',
		'./src/model',
	],
];
