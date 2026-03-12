<?php

return [
	'extensions' => [
		'type',
		'im:messenger/const',
		'im:messenger/lib/helper',
		'im:messenger/lib/di/service-locator',
	],
	'bundle' => [
		'./src/component-request-handler',
		'./src/handler/get-recent-user-list-to-call',
	],
];
