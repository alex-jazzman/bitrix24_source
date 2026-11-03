<?php

return [
	'extensions' => [
		'device/connection',
		'statemanager/redux/store',
		'statemanager/redux/toolkit',
		'mail:const',
		'mail:label/transport',
		'mail:statemanager/redux/slices/labels',
		'mail:statemanager/redux/slices/labels/meta',
		'mail:statemanager/redux/slices/mailboxes/selector',
	],
	'bundle' => [
		'./src/factory',
	],
];
