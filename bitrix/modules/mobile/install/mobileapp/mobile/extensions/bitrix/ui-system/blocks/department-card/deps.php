<?php

return [
	'extensions' => [
		'layout/pure-component',
		'loc',
		'statemanager/redux/connect',
		'statemanager/redux/slices/users/selector',
		'tokens',
		'type',
		'ui-system/blocks/avatar',
		'ui-system/blocks/icon',
		'ui-system/layout/card',
		'ui-system/typography/text',
		'ui-system/blocks/badges/counter',
		'utils/test',
		'utils/enums/base',
		'intranet:statemanager/redux/slices/department',
	],
	'bundle' => [
		'./src/card',
		'./src/mode-enum',
		'./src/redux-provider',
	],
];
