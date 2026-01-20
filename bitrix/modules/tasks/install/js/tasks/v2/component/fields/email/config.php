<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/email.bundle.css',
	'js' => 'dist/email.bundle.js',
	'rel' => [
		'ui.vue3.directives.hint',
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.component.elements.hint',
		'main.core',
		'tasks.v2.const',
		'tasks.v2.lib.calendar',
		'ui.system.chip.vue',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.lib.field-highlighter',
	],
	'skip_core' => false,
];
