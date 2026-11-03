<?php

return [
	'extensions' => [
		'communication/connection',
		'crm:communication/button',
		'crm:simple-list/items/crm-entity',
		'crm:statemanager/redux/slices/kanban-settings',
		'crm:statemanager/redux/slices/stage-settings',
		'layout/ui/fields',
		'layout/ui/friendly-date',
		'loc',
		'money',
		'statemanager/redux/connect',
		'tokens',
		'type',
		'ui-system/blocks/avatar',
		'ui-system/blocks/badges/counter',
		'ui-system/blocks/icon',
		'ui-system/typography/text',
		'user-profile',
		'ui-system/blocks/chips/chip-button',
		'utils/color',
		'utils/date',
		'utils/object',
	],
	'bundle' => [
		'./src/stage-chip',
	],
];
