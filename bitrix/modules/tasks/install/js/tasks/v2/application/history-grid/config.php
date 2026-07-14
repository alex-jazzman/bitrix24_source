<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/history-grid.bundle.css',
	'js' => 'dist/history-grid.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.date',
		'main.popup',
		'tasks.v2.lib.api-client',
		'tasks.v2.lib.timezone',
		'tasks.v2.provider.service.user-service',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.rich-loc',
		'ui.vue3.mixins.loc-mixin',
	],
	'skip_core' => false,
];
