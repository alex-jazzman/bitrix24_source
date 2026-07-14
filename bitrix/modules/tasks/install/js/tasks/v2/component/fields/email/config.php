<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/email.bundle.css',
	'js' => 'dist/email.bundle.js',
	'rel' => [
		'main.core',
		'tasks.v2.component.elements.hint',
		'tasks.v2.component.elements.hover-pill',
		'tasks.v2.const',
		'tasks.v2.lib.calendar',
		'tasks.v2.lib.field-highlighter',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.chip.vue',
		'ui.vue3.directives.hint',
	],
	'skip_core' => false,
];
