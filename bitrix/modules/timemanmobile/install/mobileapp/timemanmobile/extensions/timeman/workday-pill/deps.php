<?php

return [
	'extensions' => [
		'feature-flag',
		'in-app-url',
		'layout/pure-component',
		'loc',
		'statemanager/redux/connect',
		'toast',
		'tokens',
		'ui-system/blocks/chips/chip-button',
		'ui-system/blocks/icon',
		'ui-system/popups/popup-menu',
		'utils/enums/base',
		'utils/skeleton',
		'utils/test',
		'timeman:analytics/workday-analytics',
		'timeman:const',
		'timeman:statemanager/redux/slices/worktime',
		'timeman:work-reports/submit/daily',
	],
	'bundle' => [
		'./src/enum/pill-design',
		'./src/ui/pill-shimmer',
		'./src/ui/pill-view',
	],
];
