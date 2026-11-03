<?php

return [
	'extensions' => [
		'statemanager/redux/store',
		'tasks:checklist/enum',
		'tasks:checklist/view-model/support',
		'tasks:statemanager/redux/slices/checklist-items',
		'tasks:statemanager/redux/slices/checklists',
		'tasks:statemanager/redux/slices/checklists/model',
	],
	'bundle' => [
		'./src/view/item-view',
		'./src/view/checklist-view',
	],
];
