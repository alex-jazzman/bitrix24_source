<?php

return [
	'extensions' => [
		'apptheme',
		'assets/icons',
		'feature',
		'feature-flag',
		'tokens',
		'type',

		'layout/pure-component',
		'layout/ui/loaders/spinner',

		'more-menu/block/company/support',

		'debug/prism',

		'utils/test',
		'utils/uri',
	],
	'components' => [
		// the opener takes the address of the script from here; the component is named at runtime, so the
		// automatic sync of dependencies would drop the entry without this mark
		'bitrix-answers', //@keep
	],
	'bundle' => [
		'./src/bridge',
		'./src/const',
		'./src/nav-state',
		'./src/opener',
		'./src/screen',
	],
];
