<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/template-history-chip.bundle.css',
	'js' => 'dist/template-history-chip.bundle.js',
	'rel' => [
		'main.polyfill.core',
		'main.core.events',
		'tasks.v2.component.elements.hint',
		'tasks.v2.const',
		'tasks.v2.lib.id-utils',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.chip.vue',
		'ui.vue3.directives.hint',
	],
	'skip_core' => true,
];
