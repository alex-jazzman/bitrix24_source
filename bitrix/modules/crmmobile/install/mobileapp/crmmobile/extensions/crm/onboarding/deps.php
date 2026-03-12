<?php

return [
	'extensions' => [
		'loc',
		'onboarding',
		'onboarding/action',
		'onboarding/case',
		'onboarding/condition',
		'onboarding/const',
		'qrauth',
		'rest/run-action-executor',
		'statemanager/redux/store',
		'type',

		'crm:statemanager/redux/slices/kanban-settings',
		'crm:statemanager/redux/slices/stage-counters',
		'crm:statemanager/redux/slices/stage-settings',
		'crm:type',
	],
	'bundle' => [
		'./src/condition',
		'./src/const',
		'./src/utils',
	],
];
