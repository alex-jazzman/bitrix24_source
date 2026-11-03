<?php

return [
	'extensions' => [
		'mail:signatures/compose',
		'assets/icons',
		'loc',
		'tokens',
		'toast',
		'alert',
		'layout/pure-component',
		'layout/ui/loaders/spinner',
		'ui-system/blocks/avatar',
		'ui-system/blocks/icon',
		'ui-system/blocks/status-block',
		'ui-system/form/buttons/button',
		'ui-system/form/inputs/textarea',
		'ui-system/form/inputs/string',
		'ui-system/form/checkbox',
		'ui-system/layout/area',
		'ui-system/layout/area-list',
		'ui-system/layout/box',
		'ui-system/layout/card',
		'ui-system/popups/popup-menu',
		'ui-system/typography/text',
	],
	'bundle' => [
		'./src/signature-create',
		'./src/signature-sender-selector',
		'./src/signature-list',
		'./src/signature-navigator',
	],
];
