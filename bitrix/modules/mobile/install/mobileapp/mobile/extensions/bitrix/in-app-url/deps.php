<?php

return [
	'extensions' => [
		'loc',
		'require-lazy/extension-loader',
		'in-app-url/portal-page',
		'in-app-url/route',
		'in-app-url/presentation',
		'in-app-url/widget-presenter',
		'in-app-url/url',
		'toast',
		'utils/string',
		'utils/url',

		// the registrars below are required by name from src/in-app-extensions: staying in the bundle
		// lets a cold start by deeplink register the routes before the first open
		'in-app-url/routes', // @keep
		'in-app-url/routes/bitrix24', // @keep
		'in-app-url/routes/development-routes', // @keep
		'in-app-url/routes/intent', // @keep
		'in-app-url/routes/market', // @keep
		'in-app-url/routes/note', // @keep
		'in-app-url/routes/settings', // @keep
		'in-app-url/routes/stafftrack', // @keep
		'in-app-url/routes/timeman', // @keep
		'in-app-url/routes/vibecode', // @keep
		'bizproc:in-app-url/routes', // @keep
		'calendar:in-app-url/routes', // @keep
		'call:in-app-url/routes', // @keep
		'crm:in-app-url/routes', // @keep
		'disk:in-app-url/routes', // @keep
		'im:in-app-url/routes', // @keep
		'intranet:in-app-url/routes', // @keep
		'lists:in-app-url/routes', // @keep
		'mail:in-app-url/routes', // @keep
		'sign:in-app-url/routes', // @keep
		'stafftrack:in-app-url/routes', // @keep
		'tasks:in-app-url/routes', // @keep
	],
	'bundle' => [
		'./src/in-app-extensions',
		'./src/in-app-url',
	],
];
