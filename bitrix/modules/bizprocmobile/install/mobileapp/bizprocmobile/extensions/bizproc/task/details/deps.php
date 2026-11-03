<?php

return [
	'bundle' => [
		'./buttons',
	],
	'extensions' => [
		'alert',
		'apptheme',
		'in-app-url',
		'loc',
		'haptics',
		'event-emitter',
		'notify-manager',
		'toast',
		'tokens',
		'qrauth',
		// BX.ajax appears only for whoever requires rest; the screen completes and delegates tasks with it
		'rest', // @keep
		'require-lazy',
		'type',
		'ui-system/typography/heading',
		'ui-system/typography/text',

		'utils/file',
		'utils/function',
		'utils/random',

		'layout/ui/context-menu',
		'layout/pure-component',
		'layout/ui/fields/focus-manager',
		'selector/widget/factory',

		'bizproc:helper/network-error',
		'bizproc:workflow/comments',
		'bizproc:task/task-constants',
		'bizproc:task/buttons',
		'bizproc:task/fields',
		'bizproc:skeleton',
		'bizproc:app-rating-client',
	],
];
