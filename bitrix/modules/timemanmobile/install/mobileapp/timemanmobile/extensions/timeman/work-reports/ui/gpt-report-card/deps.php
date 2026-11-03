<?php

return [
	'extensions' => [
		'asset-manager',
		'layout/pure-component',
		'tokens',
		'ui-system/typography/bbcodetext',
		'ui-system/typography/heading',
		'ui-system/typography/text',
		'utils/test',
		'timeman:work-reports/enum',
		'timeman:work-reports/loc',
		'timeman:work-reports/utils',
	],
	'bundle' => [
		'./src/heights',
		'./src/base',
		'./src/gpt-report',
		'./src/robot-report',
	],
];
