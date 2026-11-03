<?php

return [
	'extensions' => [
		'type',
		'im:messenger/provider/pull/base/pull-handler',
		'im:messenger/lib/logger',
		'im:messenger/lib/feature',
	],
	'bundle' => [
		'./src/collection-target',
		'./src/pending-file',
	],
];
