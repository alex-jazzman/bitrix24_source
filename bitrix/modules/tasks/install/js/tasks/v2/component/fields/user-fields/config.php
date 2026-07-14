<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/user-fields.bundle.css',
	'js' => 'dist/user-fields.bundle.js',
	'rel' => [
		'main.core',
		'main.date',
		'tasks.v2.component.elements.checkbox',
		'tasks.v2.const',
		'tasks.v2.lib.calendar',
		'tasks.v2.lib.field-highlighter',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.system.chip.vue',
		'ui.system.typography.vue',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
