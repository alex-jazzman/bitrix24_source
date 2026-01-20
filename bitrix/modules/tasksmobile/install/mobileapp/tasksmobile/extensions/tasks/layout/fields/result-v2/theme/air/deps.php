<?php

return [
	'extensions' => [
		'alert',
		'bbcode/formatter/plain-text-formatter',
		'layout/pure-component',
		'layout/ui/collapsible-text',
		'layout/ui/fields/file',
		'layout/ui/fields/theme',
		'layout/ui/fields/theme/air/elements/add-button',
		'layout/ui/friendly-date',
		'layout/ui/friendly-date/formatter-factory',
		'layout/ui/user/user-name',
		'loc',
		'statemanager/redux/connect',
		'tasks:layout/fields/result-v2',
		'tasks:layout/fields/result-v2/menu',
		'tasks:statemanager/redux/slices/tasks',
		'tasks:statemanager/redux/slices/tasks-results-v2',
		'tokens',
		'ui-system/blocks/avatar',
		'ui-system/blocks/icon',
		'ui-system/layout/card',
		'ui-system/typography/text',
		'utils/skeleton',
	],
	'bundle' => [
		'./src/redux-content',
	],
];
