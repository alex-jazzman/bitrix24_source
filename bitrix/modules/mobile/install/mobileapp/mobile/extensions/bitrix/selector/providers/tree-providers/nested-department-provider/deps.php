<?php

return [
	'extensions' => [
		'loc',
		'ui-system/blocks/avatar',
		'layout/ui/user/user-name',
		'selector/providers/common',
		'tasks:ui/avatars/project-avatar',
		'tokens',
		'assets/icons',
		'utils/url',
		'selector/widget/entity/tree-selectors/shared/navigator',
	],
	'bundle' => [
		'./src/entities/user',
		'./src/entities/meta-user',
		'./src/entities/department',
		'./src/entities/structure-node',
		'./src/entities/project',
		'./src/entities/base-entity',
	],
];
