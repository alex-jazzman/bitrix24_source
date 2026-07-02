<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/massconnect-form.bundle.css',
	'js' => 'dist/massconnect-form.bundle.js',
	'rel' => [
		'mail.setting-selector',
		'main.core',
		'ui.analytics',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.icon-set.api.vue',
		'ui.notification',
		'ui.switcher',
		'ui.system.input',
		'ui.system.input.vue',
		'ui.vue3',
		'ui.vue3.components.avatar',
		'ui.vue3.components.button',
		'ui.vue3.components.menu',
		'ui.vue3.components.switcher',
		'ui.vue3.directives.hint',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];
