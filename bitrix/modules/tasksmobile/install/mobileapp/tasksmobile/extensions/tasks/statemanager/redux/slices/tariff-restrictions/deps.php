<?php

return [
	'extensions' => [
		'statemanager/redux/reducer-registry',
		'statemanager/redux/toolkit',
		'tasks:statemanager/redux/slices/tariff-restrictions/meta',
		'tasks:statemanager/redux/slices/tariff-restrictions/selector',
		'tasks:statemanager/redux/slices/tariff-restrictions/thunk',
		'tasks:statemanager/redux/slices/tariff-restrictions/tools',
	],
	'bundle' => [
		'./src/extra-reducer',
	],
];
