<?php

return [
	'extensions' => [
		'layout/ui/simple-list/items/base',
		'layout/pure-component',
		'statemanager/redux/connect',
		'tokens',
		'tasks:ui/avatars/project-avatar',
		'tasks:statemanager/redux/slices/groups',
		'tasks:statemanager/redux/slices/project-list',
		'ui-system/blocks/avatar',
		'ui-system/blocks/badges/counter',
		'ui-system/blocks/avatar-stack',
		'ui-system/typography/text',
		'utils/color',
		'utils/date',
		'utils/date/formats',
	],
	'bundle' => [
		'./src/role-badge-icon',
		'./src/project-avatar-stacks',
		'./src/project-content',
	],
];
