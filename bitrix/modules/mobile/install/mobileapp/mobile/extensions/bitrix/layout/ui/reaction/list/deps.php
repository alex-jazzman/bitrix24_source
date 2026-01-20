<?php

return [
	'extensions' => [
		'bottom-sheet',
		'layout/ui/reaction/list/tab-panel',
		'layout/ui/reaction/list/user-list',
		'tokens',
		'type',

		'statemanager/redux/batched-actions',
		'statemanager/redux/slices/users',
		'statemanager/redux/slices/users/thunk',
		'statemanager/redux/store',
	],
	'bundle' => [
		'./src/view',
		'./src/controller',
	],
];
