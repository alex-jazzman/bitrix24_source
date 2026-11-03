<?php

return [
	'extensions' => [
		'apptheme',
		'bottom-sheet',
		'layout/ui/qr-code-frame',
		'loc',
		'pull/client/events', // @keep BX.PULL is a runtime global
		'rest/run-action-executor',
		'toast',
		'tokens',
		'tourist',
		'type',
		'ui-system/form/buttons/button',
		'ui-system/layout/area',
		'ui-system/layout/area-list',
		'ui-system/layout/box',
		'ui-system/typography/text',
		'utils/test',
		'utils/url',
	],
	'bundle' => [
		'./src/code-cache',
		'./src/refresh-scheduler',
		'./src/code-timer',
		'./src/code-sheet',
	],
];
