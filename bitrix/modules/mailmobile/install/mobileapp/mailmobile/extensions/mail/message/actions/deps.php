<?php

return [
	'extensions' => [
		'loc',
		'toast',
		'qrauth/utils',
		'statemanager/redux/store',
		'mail:folder/selector',
		'mail:enum/default-folder-type',
		'mail:statemanager/redux/slices/messages/thunk',
		'mail:statemanager/redux/slices/folders/selector',
		'mail:statemanager/redux/slices/mailboxes/selector',
	],
	'bundle' => [
		'./src/change-folder',
		'./src/change-read-status',
	],
];
