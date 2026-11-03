<?php

return [
	'extensions' => [
		'loc',
		'money',
		'layout/ui/kanban/toolbar',
		'layout/pure-component',
		'tokens',
		'ui-system/blocks/icon',
		'ui-system/typography/text',
		'utils/object',

		'statemanager/redux/connect',
		'crm:statemanager/redux/slices/stage-settings',
		'crm:statemanager/redux/slices/stage-counters',
		'crm:statemanager/redux/slices/kanban-settings',
	],
	'bundle' => [
		'./entity-toolbar',
		'./stage-dropdown',
		'./stage-summary',
		'./compact-stage-control',
	],
];
