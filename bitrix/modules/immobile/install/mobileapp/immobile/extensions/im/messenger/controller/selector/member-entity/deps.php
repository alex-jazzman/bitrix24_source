<?php

return [
	'extensions' => [
		'type',
		'debug/prism',
		'error',
		'ui-system/blocks/icon',
		'selector/providers/tree-providers/nested-department-provider',
		'selector/widget/entity/tree-selectors/nested-department-selector',
		'im:messenger/const',
		'im:messenger/lib/helper',
		'im:messenger/lib/logger',
		'im:messenger/lib/params',
		'im:messenger/lib/permission-manager',
		'im:messenger/lib/project-access-guard',
		'im:messenger/lib/ui/notification',
		'im:messenger/loc',
		'im:messenger/provider/services/chat',
	],
	'bundle' => [
		'./src/member-entity-selector',
	],
];
