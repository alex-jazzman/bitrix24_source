<?php

return [
	'extensions' => [
		'loc',
		'type',
		'im:lib/theme',
		'utils/validation',
		'layout/ui/loaders/spinner',
		'tokens',
		'ui-system/typography/text',
	],
	'bundle' => [
		'./src/base-loader',
		'./src/spinner-loader',
	],
];
