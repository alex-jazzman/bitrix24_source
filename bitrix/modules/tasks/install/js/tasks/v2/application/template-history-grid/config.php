<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/template-history-grid.bundle.css',
	'js' => 'dist/template-history-grid.bundle.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'main.date',
		'main.popup',
		'tasks.v2.component.elements.hint',
		'tasks.v2.const',
		'tasks.v2.lib.api-client',
		'tasks.v2.lib.timezone',
		'ui.icon-set.api.vue',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.mixins.loc-mixin',
	],
	'skip_core' => false,
];
