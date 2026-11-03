<?php

return [
	'extensions' => [
		'loc',
		'statemanager/redux/store',
		'mail:statemanager/redux/slices/folders',
		'mail:statemanager/redux/slices/folders/selector',
		'mail:statemanager/redux/slices/labels',
		'mail:statemanager/redux/slices/labels/selector',
		'mail:statemanager/redux/slices/mailboxes/selector',
	],
	'bundle' => [
		'./src/keys',
	],
];
