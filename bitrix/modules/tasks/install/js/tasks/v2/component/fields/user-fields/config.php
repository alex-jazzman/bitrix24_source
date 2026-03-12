<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/user-fields.bundle.css',
	'js' => 'dist/user-fields.bundle.js',
	'rel' => [
		'tasks.v2.component.elements.checkbox',
		'ui.system.typography.vue',
		'tasks.v2.lib.calendar',
		'main.date',
		'main.core',
		'ui.vue3.vuex',
		'ui.system.chip.vue',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'tasks.v2.const',
		'tasks.v2.lib.field-highlighter',
	],
	'skip_core' => false,
];
