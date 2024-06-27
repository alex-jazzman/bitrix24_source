<?php

return [
	'extensions' => [
		'rest/run-action-executor',
		'statemanager/redux/toolkit',
		'tasks:statemanager/redux/slices/tariff-plan-restrictions/meta',
	],
	'bundle' => [
		'./src/data-provider',
	],
];
