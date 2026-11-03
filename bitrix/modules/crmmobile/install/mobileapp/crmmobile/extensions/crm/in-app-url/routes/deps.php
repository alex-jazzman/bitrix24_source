<?php

return [
	'extensions' => [
		'analytics',
		'in-app-url/presentation',
		'in-app-url/widget-presenter',
		'in-app-url/portal-page',
		'layout/ui/info-helper',
		'require-lazy',
		'crm:disabling-tools',
		'crm:type',
		'crm:in-app-url/routes/entity-list-target',
		'crm:in-app-url/routes/query-params',
	],
	'bundle' => [
		'./src/open-actions',
	],
];
