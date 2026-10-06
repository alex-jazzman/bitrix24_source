<?php

return [
	'bundle' => [
		'./content',
	],
	'extensions' => [
		'apptheme',
		'alert',
		'event-emitter',
		'in-app-url',
		'haptics',
		'loc',
		'notify-manager',
		'tokens',

		'utils/random',

		'ui-system/typography/heading',
		'ui-system/typography/text',

		'layout/pure-component',
		'layout/ui/fields/focus-manager',
		'layout/ui/entity-editor/manager',
		'layout/ui/collapsible-text',

		'bizproc:helper/network-error',
		'bizproc:workflow/comments',
		'bizproc:skeleton',
	],
];
