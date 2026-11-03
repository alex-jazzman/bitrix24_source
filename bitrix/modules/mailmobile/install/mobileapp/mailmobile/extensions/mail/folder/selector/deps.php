<?php

return [
	'extensions' => [
		'layout/ui/scroll-view',
		'loc',
		// The collapsed state of the sections is kept in Application.storageById, which utils/storage installs.
		'utils/storage', //@keep
		'mail:statemanager/redux/slices/folders/observers/stateful-list',
		'mail:statemanager/redux/slices/folders/selector',
		'mail:statemanager/redux/slices/messages/selector',
		'mail:statemanager/redux/slices/folders',
		'mail:enum/default-folder-type',
		'mail:mailbox/selector',
		'mail:folder/virtual',
		'mail:folder/virtual/src/keys',
		'mail:statemanager/redux/slices/mailboxes/selector',
		'mail:statemanager/redux/slices/labels/observers/stateful-list',
		'mail:statemanager/redux/slices/labels/selector',
		'mail:statemanager/redux/slices/labels/thunk',
		'mail:draft/connector',
		'statemanager/redux/store',
		'tokens',
		'ui-system/blocks/icon',
		'ui-system/layout/box',
		'ui-system/typography/text',
	],
	'bundle' => [
		'./src/sections',
	],
];
