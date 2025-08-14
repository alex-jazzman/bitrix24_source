<?php

return [
	'extensions' => [
		'haptics',
		'im:lib/theme',
		'im:messenger/loc',
		'im:messenger/assets/common',
		'im:messenger/lib/ui/base/item',
		'im:messenger/lib/emitter',
		'im:messenger/const',
		'im:messenger/lib/element',
		'im:messenger/lib/date-formatter',
		'im:messenger/provider/services/reaction',
	],
	'bundle' => [
		'./src/controller',
		'./src/reaction-item',
		'./src/user-list',
		'./src/view',
	],
];
