<?php

return [
	'extensions' => [
		'analytics',
		'assets/icons',
		'layout/ui/list/base-more-menu',
		'layout/ui/list/base-sorting',
		'layout/ui/menu',
		'loc',
		'tokens',
		'type',
		'utils/object',
		'tasks:dashboard/filter',
		'tasks:dashboard/settings-action-executor',
		'tasks:loc',
		'tasks:statemanager/redux/types',
	],
	'bundle' => [
		'./src/more-menu',
		'./src/navigation-title',
		'./src/pull',
		'./src/sorting',
	],
];
