<?php

return [
	'extensions' => [
		'layout/ui/scroll-view',
		'loc',
		'tokens',
		'ui-system/blocks/chips/chip-inner-tab',
		'ui-system/blocks/reaction/icon',

		'statemanager/redux/connect',
		'statemanager/redux/slices/reactions/selector',
	],
	'bundle' => [
		'./src/tab-panel',
		'./src/redux-panel',
	],
];