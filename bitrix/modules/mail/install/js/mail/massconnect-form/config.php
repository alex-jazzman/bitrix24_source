<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/massconnect-form.bundle.css',
	'js' => 'dist/massconnect-form.bundle.js',
	'rel' => [
		'ui.vue3',
		'ui.system.input',
		'ui.system.input.vue',
		'ui.notification',
		'ui.vue3.components.menu',
		'ui.buttons',
		'ui.icon-set.api.vue',
		'mail.setting-selector',
		'ui.vue3.directives.hint',
		'ui.entity-selector',
		'ui.vue3.components.switcher',
		'ui.switcher',
		'main.core',
		'ui.vue3.components.button',
		'ui.vue3.pinia',
		'ui.analytics',
	],
	'skip_core' => false,
];
