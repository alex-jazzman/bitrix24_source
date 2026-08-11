<?php

return [
	'extensions' => [
		'call:const',
		'call:calls/users',
		'call:calls/menu',
		'call:const',
		'bottom-sheet',
		'tourist',
		'ui-system/popups/aha-moment',
		'selector/utils/word-separator',
		'ui-system/blocks/avatar',
		'ui-system/blocks/badges/counter',
		'animation',
		'layout/pure-component',
	],
	'bundle'=> [
		'./copilot-drawer',
		'./floor-requests-list',
		'./participants-list',
		'./src/util',
		'./src/batch-snapshot',
		'./icons/icons',
		'./scroll-manager',
		'./scrollview-grid',
		'./gridview-grid',
		'./user-video',
		'./user-card',
		'./name-badge',
		'./call-top-panel',
	]
];
