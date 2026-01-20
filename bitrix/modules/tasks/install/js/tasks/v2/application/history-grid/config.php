<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/history-grid.bundle.css',
	'js' => 'dist/history-grid.bundle.js',
	'rel' => [
		'ui.vue3',
		'ui.vue3.mixins.loc-mixin',
		'main.core.events',
		'main.popup',
		'ui.system.typography.vue',
		'tasks.v2.lib.api-client',
		'tasks.v2.provider.service.user-service',
		'ui.vue3.components.rich-loc',
		'tasks.v2.lib.timezone',
		'main.date',
		'main.core',
	],
	'skip_core' => false,
];
