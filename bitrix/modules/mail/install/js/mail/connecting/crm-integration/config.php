<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/crm-integration.bundle.css',
	'js' => 'dist/crm-integration.bundle.js',
	'rel' => [
		'mail.setting-selector',
		'main.core',
		'ui.entity-selector',
		'ui.switcher',
		'ui.system.typography.vue',
		'ui.vue3',
		'ui.vue3.components.switcher',
		'ui.vue3.directives.hint',
	],
	'skip_core' => false,
];
