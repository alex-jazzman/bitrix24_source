<?php

return [
	'extensions' => [
		'assets/icons/types',
		'layout/ui/list/base-filter',
		'layout/ui/list/base-more-menu',
		'layout/ui/list/base-sorting',
		'layout/ui/menu',
		'loc',
		'qrauth/utils',
		'selector/widget/entity/intranet/department',
		'statemanager/redux/store',
		'tokens',
		'ui-system/blocks/icon',
		'ui-system/typography/text',
		'intranet:enum',
		'intranet:statemanager/redux/slices/employees/selector',
	],
	'bundle' => [
		'./src/department-button',
		'./src/filter',
		'./src/more-menu',
		'./src/sorting',
	],
];
