<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/template-history-grid.bundle.css',
	'js' => 'dist/template-history-grid.bundle.js',
	'rel' => [
		'ui.vue3',
		'ui.vue3.mixins.loc-mixin',
		'main.core.events',
		'main.popup',
		'ui.system.typography.vue',
		'tasks.v2.lib.api-client',
		'tasks.v2.const',
		'main.date',
		'tasks.v2.lib.timezone',
		'ui.icon-set.api.vue',
		'tasks.v2.component.elements.hint',
		'main.core',
	],
	'skip_core' => false,
];
