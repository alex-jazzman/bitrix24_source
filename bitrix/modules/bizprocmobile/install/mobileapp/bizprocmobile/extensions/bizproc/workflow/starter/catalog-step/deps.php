<?php

return [
	'bundle' => [
		'./component',
		'./view',
		'./skeleton',
	],
	'extensions' => [
		'apptheme',
		'event-emitter',
		'loc',
		'storage-cache',
		'notify-manager',

		'utils/type',
		'utils/random',
		'utils/skeleton',

		'ui-system/typography/text',
		'tokens',

		'layout/pure-component',
		'layout/ui/empty-screen',
		'layout/ui/wizard/step',

		'bizproc:helper/network-error',
		'bizproc:wizard/progress-bar-number',
		'bizproc:helper/duration',
	],
];
