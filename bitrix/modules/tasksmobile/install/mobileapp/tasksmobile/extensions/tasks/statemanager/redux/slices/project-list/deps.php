<?php

return [
	'extensions' => [
		'statemanager/redux/reducer-registry',
		'statemanager/redux/toolkit',
		'tasks:statemanager/redux/slices/project-list/meta',
	],
	'bundle' => [
		'./src/action',
		'./src/reducer',
		'./src/selector',
		'./src/slice',
		'./src/tools',
	],
];
