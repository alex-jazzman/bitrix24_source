<?php

return [
	'extensions' => [
		'mail:message/elements/avatar',
		'mail:const',
		'mail:statemanager/redux/slices/mailboxes',
		'statemanager/redux/store',
		'mail:statemanager/redux/slices/mailboxes/selector',
		'mail:statemanager/redux/slices/mailboxes/observers/stateful-list',
		'mail:dialog',
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
		'mail:mailbox/settings',
		'mail:mailbox/folders-settings',
		'ui-system/blocks/icon',
	],
	'bundle' => [
		'./src/more-menu',
	],
];
