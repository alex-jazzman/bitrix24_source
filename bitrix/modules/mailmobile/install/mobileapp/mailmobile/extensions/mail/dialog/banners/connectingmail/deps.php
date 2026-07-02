<?php

return [
	'extensions' => [
		'ui-system/form/buttons/button',
		'ui-system/form/inputs/textarea',
		'ui-system/blocks/status-block',
		'ui-system/blocks/icon',
		'ui-system/layout/box',
		'ui-system/layout/dialog-footer',
		'ui-system/typography/heading',
		'ui-system/typography/text',
		'loc',
		'tokens',
		'notify-manager',
		'analytics',
		'mail:const',
		'mail:mailbox/connector',
	],
	'bundle' => [
		'./src/connecting-mail',
		'./src/form-drawer',
		'./src/status-drawer',
	],
];
