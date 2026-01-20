<?php

return [
	'extensions' => [
		'mail:message/elements/avatar',
		'mail:const',
		'mail:statemanager/redux/slices/mailboxes',
		'statemanager/redux/store',
		'mail:statemanager/redux/slices/mailboxes/selector',
		'mail:dialog',
		'mail:statemanager/redux/slices/mailboxes/selector',
        'mail:statemanager/redux/slices/mailboxes/observers/stateful-list',
        'tokens',
		'loc',
		'ui-system/form/buttons/button',
		'assets/icons',
		'mail:statemanager/redux/slices/folders/selector',
		'mail:statemanager/redux/slices/folders/observers/stateful-list',
		'layout/ui/list/base-more-menu',
		'layout/ui/menu',
		'haptics',
		'alert/confirm',
		'mail:statemanager/redux/slices/mailboxes/thunk',
		'statemanager/redux/store',
	],
	'bundle' => [
		'./src/more-menu',
	],
];
