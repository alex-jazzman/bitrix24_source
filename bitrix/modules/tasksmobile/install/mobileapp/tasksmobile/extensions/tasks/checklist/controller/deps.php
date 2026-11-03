<?php

return [
	'extensions' => [
		'loc',
		'toast',
		'debug/prism',
		'device/connection',
		'utils/function',
		'statemanager/redux/store',
		'statemanager/redux/batched-actions',
		'tasks:checklist/enum',
		'tasks:checklist/widget',
		'tasks:checklist/view-model',
		'tasks:statemanager/redux/slices/checklists',
		'tasks:statemanager/redux/slices/checklists/model',
		'tasks:statemanager/redux/slices/checklist-items',
		'tasks:statemanager/redux/slices/tasks',
	],
	'bundle' => [
		'./src/filter-storage',
	],
];
