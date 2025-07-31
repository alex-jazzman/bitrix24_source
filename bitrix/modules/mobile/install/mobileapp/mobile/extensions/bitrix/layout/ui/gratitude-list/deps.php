<?php

return [
	'extensions' => [
		'loc',
		'utils/enums/base',
		'layout/ui/stateful-list',
		'ui-system/blocks/status-block',
		'asset-manager',
		'tokens',
		'layout/ui/simple-list/items',
		'layout/ui/simple-list/items/base',
		'assets/gratitude-icons',
		'ui-system/typography/text',
		'ui-system/blocks/avatar',
		'statemanager/redux/slices/users/thunk',
		'statemanager/redux/store',
		'statemanager/redux/connect',
		'statemanager/redux/slices/users',
		'in-app-url',
		'layout/pure-component',
		'statemanager/redux/slices/gratitude',
		'assets/icons',
	],
	'bundle' => [
		'./src/list',
		'./src/item',
		'./src/redux-item',
		'./src/factory',
		'./src/gratitude',
	],
];
