<?php

return [
	'extensions' => [
		'alert/confirm',
		'assets/icons',
		'haptics',
		'layout/ui/list/base-more-menu',
		'layout/ui/menu',
		'loc',
		'mail:const',
		'mail:dialog',
		'mail:mailbox/settings',
		'mail:mailbox/folders-settings',
		'mail:message/elements/avatar',
		'mail:statemanager/redux/slices/folders/observers/stateful-list',
		'mail:statemanager/redux/slices/folders/selector',
		'mail:statemanager/redux/slices/mailboxes',
		'mail:statemanager/redux/slices/mailboxes/observers/stateful-list',
		'mail:statemanager/redux/slices/mailboxes/selector',
		'mail:statemanager/redux/slices/mailboxes/thunk',
		'statemanager/redux/store',
		'tokens',
		'ui-system/blocks/icon',
		'ui-system/form/buttons/button',
		'ui-system/typography/text',
	],
	'bundle' => [
		'./src/more-menu',
	],
];
