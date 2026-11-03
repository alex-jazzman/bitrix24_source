<?php

return [
	'extensions' => [
		'debug/prism',
		'mail:templates/compose',
		'mail:draft/compose-state',
		'loc',
		'tokens',
		'alert',
		'toast',
		'layout/pure-component',
		'layout/ui/loaders/spinner',
		'ui-system/blocks/status-block',
		'ui-system/form/buttons/button',
		'ui-system/form/inputs/string',
		'ui-system/form/inputs/textarea',
		'ui-system/layout/box',
		'ui-system/layout/card',
		'ui-system/typography/text',
	],
	'bundle' => [
		'./src/template-picker',
		'./src/template-list',
		'./src/template-navigator',
		'./src/template-preview',
		'./src/template-create',
		'./src/template-apply-dialog',
	],
];
