<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => './dist/result-message-menu.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'tasks.v2.const',
		'tasks.v2.provider.service.result-message-service',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
	],
	'skip_core' => false,
];
