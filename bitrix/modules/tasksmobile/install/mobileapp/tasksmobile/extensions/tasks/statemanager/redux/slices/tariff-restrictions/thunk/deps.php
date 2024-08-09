<?php

return [
	'extensions' => [
		'rest/run-action-executor',
		'statemanager/redux/toolkit',
		'tasks:statemanager/redux/slices/tariff-restrictions/meta',
	],
	'bundle' => [
		'./src/data-provider',
	],
];
