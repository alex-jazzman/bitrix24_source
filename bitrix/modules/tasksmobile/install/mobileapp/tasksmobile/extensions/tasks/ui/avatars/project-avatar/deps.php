<?php

return [
	'extensions' => [
		'statemanager/redux/connect',
		'statemanager/redux/store',
		'ui-system/blocks/avatar',
		'tasks:statemanager/redux/slices/groups',
	],
	'bundle' => [
		'./src/providers/redux',
		'./src/providers/selector',
	],
];
