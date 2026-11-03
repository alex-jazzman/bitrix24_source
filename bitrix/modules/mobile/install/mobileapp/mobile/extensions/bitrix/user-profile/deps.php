<?php

return [
	'components' => [
		'user-profile-tabs', //@keep
		'intranet:user.list', //@keep
	],
	'extensions' => [
		'feature',
		'in-app-url/presentation',
		'in-app-url/widget-presenter',
		'loc',
		'notify-manager',
		'user-profile/const',
		'user-profile/tabs-preparer',
	],
];
