<?php

return [
	'components' => [
		'intranet:invite',
	],
	'extensions' => [
		'analytics',
		'asset-manager',
		'intranet:invite-new',
		'intranet:invite-opener-new/api',
		'layout/ui/status-box',
		'loc',
		'notify',
	],
	'bundle' => [
		'./src/component-opener',
	],
];
