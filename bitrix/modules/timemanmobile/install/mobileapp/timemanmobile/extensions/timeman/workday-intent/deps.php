<?php

return [
	'components' => [
		'timeman:workday-intent-box',
		'timeman:workday-intent-box-v3',
	],
	'extensions' => [
		'background/ui-manager',
		'helpers/component',
		'require-lazy',
		'rest',
		'rest/run-action-executor',
		'storage-cache',
		'im:messenger/api/dialog-opener',
		'stafftrack:feature',
	],
];
