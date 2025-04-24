<?php

return [
	'extensions' => [
		'type',
		'im:messenger/lib/logger',
		'im:messenger/lib/feature',
		'im:messenger/lib/helper',
		'im:messenger/lib/utils',
	],
	'bundle' => [
		'./src/visibility-manager',
	],
];