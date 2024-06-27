<?php

return [
	'extensions' => [
		'alert',
		'asset-manager',
		'feature',
		'haptics',
		'toast',
		'ui-system/blocks/icon',
		'selector/widget/entity/socialnetwork/user',
		'statemanager/redux/store',
		'statemanager/redux/slices/users',

		'tasks:loc',
		'tasks:layout/online',
		'tasks:layout/task/create/opener',
		'tasks:layout/task/view-new/ui/extra-settings',
		'tasks:statemanager/redux/slices/tasks',
		'tasks:statemanager/redux/slices/groups',
		'tasks:statemanager/redux/slices/tasks',
	],
	'bundle' => [
		'./src/error',
	],
];
