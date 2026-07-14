<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/config-form.bundle.css',
	'js' => 'dist/config-form.bundle.js',
	'rel' => [
		'mail.connecting.calendar-integration',
		'mail.connecting.crm-integration',
		'mail.connecting.mail-sync-settings',
		'mail.connecting.settings-config',
		'main.core',
		'main.core.events',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.icon-set.api.vue',
		'ui.switcher',
		'ui.system.input',
		'ui.system.input.vue',
		'ui.system.typography.vue',
		'ui.tour',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.components.switcher',
		'ui.vue3.directives.hint',
	],
	'skip_core' => false,
];
