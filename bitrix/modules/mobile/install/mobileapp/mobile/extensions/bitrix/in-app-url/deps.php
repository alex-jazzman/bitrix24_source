<?php

return [
	'extensions' => [
		'utils/url',
		'utils/string',
		'in-app-url/url',
		'in-app-url/const',
		'in-app-url/route',
		'in-app-url/routes',

		'sign:in-app-url/routes',
		'crm:in-app-url/routes',
		'disk:in-app-url/routes',
		'im:in-app-url/routes',
		'disk/in-app-url/routes',
		'tasks:in-app-url/routes',
		'lists:in-app-url/routes',
		'bizproc:in-app-url/routes',
		'stafftrack:in-app-url/routes',
		'calendar:in-app-url/routes',
		'call:in-app-url/routes',
	],
	'bundle' => [
		'./src/in-app-url',
	],
];
