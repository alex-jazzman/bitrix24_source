<?php

return [
	'components' => [
		'user-profile-tabs', //@keep
		'intranet:user.list', //@keep
	],
	'extensions' => [
		'assets/icons',
		'feature',
		'loc',
		'notify-manager',
		'tokens',
		'user-profile/const',
		'user-profile/tabs-preparer',
	],
];
