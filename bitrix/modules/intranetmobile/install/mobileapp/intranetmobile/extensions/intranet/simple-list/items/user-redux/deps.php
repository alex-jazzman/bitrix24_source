<?php

return [
	'extensions' => [
		'tokens',
		'loc',
		'toast',
		'bottom-sheet',
		'utils/date',
		'assets/icons/types',
		'assets/icons/src/outline',
		'layout/ui/user/avatar',
		'layout/ui/context-menu',
		'ui-system/typography/heading',
		'ui-system/form/buttons',
		'ui-system/blocks/chips/chip-status',
		'ui-system/blocks/chips/chip-button',
		'ui-system/blocks/badges/counter',
		'statemanager/redux/connect',
		'statemanager/redux/slices/users',
		'intranet:statemanager/redux/slices/employees',
		'intranet:recommendation-box/mobile-app-install',
		'communication/phone-menu',
		'utils/function',
	],
	'bundle' => [
		'./src/user-content',
		'./src/user-view',
		'./src/action-menu',
		'./src/actions',
	],
];
