<?php

return [
	'extensions' => [
		'type',
		'haptics',
		'require-lazy',
		'notify-manager',
		'device/connection',
		'im:messenger/lib/ui/notification',
		'im:messenger/loc',
		'im:messenger/const',
		'im:messenger/lib/emitter',
		'im:messenger/api/dialog-opener',
	],
	'bundle' => [
		'./src/sharing-link-handler',
	],
];
