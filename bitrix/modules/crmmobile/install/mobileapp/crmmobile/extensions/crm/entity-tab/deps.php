<?php

return [
	'extensions' => [
		'alert',
		'utils/string',
		'ui/kanban/*',
		'crm:type',
		'crm:loc',
		'crm:assets/entity',
		'crm:entity-tab/type',
		'crm:entity-detail/opener',
		'crm:state-storage',
		'layout/ui/detail-card/tabs/factory/type',
		'layout/ui/empty-screen',
		'layout/ui/simple-list/view-mode',
		'pull/client/events',
		'utils/random',
	],
	'components' => [
		'crm:crm.entity.details',
	],
	'bundle' => [
		'./filter',
		'./pull-manager',
		'./sort',
	],
];
