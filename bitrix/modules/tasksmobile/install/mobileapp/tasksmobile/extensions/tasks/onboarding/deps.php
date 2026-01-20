<?php

return [
	'extensions' => [
		'loc',
		'onboarding',
		'onboarding/action',
		'onboarding/condition',
		'onboarding/const',
		'onboarding/case',

		'statemanager/redux/store',
		'tasks:statemanager/redux/slices/tasks',
	],
	'bundle' => [
		'./src/const',
		'./src/condition',
	],
];