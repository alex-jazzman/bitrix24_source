<?php

return [
	'extensions' => [
		'im:messenger/provider/pull/base',
		'im:messenger/lib/di/service-locator',
		'im:messenger/provider/services/settings',
	],
	'bundle' => [
		'./src/settings',
	],
];
