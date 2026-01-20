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
		'ui.system.chip.vue',
		'ui.icon-set.api.vue',
		'ui.vue3.directives.hint',
		'ui.icon-set.outline',
		'tasks.v2.const',
		'tasks.v2.lib.id-utils',
		'tasks.v2.component.elements.hint',
	],
	'skip_core' => true,
];
