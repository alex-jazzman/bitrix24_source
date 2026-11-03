<?php

return [
	'extensions' => [
		'statemanager/redux/reducer-registry',
		'statemanager/redux/state-cache',
		'statemanager/redux/toolkit',
		'mail:statemanager/redux/slices/folders',
		'mail:statemanager/redux/slices/mailboxes',
		'mail:statemanager/redux/slices/labels/meta',
	],
	'bundle' => [
		'./src/state',
	],
];
