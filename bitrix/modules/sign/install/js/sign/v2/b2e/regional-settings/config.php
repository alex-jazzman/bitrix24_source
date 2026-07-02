<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/regional-settings.bundle.css',
	'js' => 'dist/regional-settings.bundle.js',
	'rel' => [
		'crm.router',
		'main.core',
		'main.core.events',
		'main.date',
		'main.popup',
		'sign.v2.api',
		'sign.v2.b2e.hcm-link-company-selector',
		'sign.v2.b2e.vue-util',
		'ui.switcher',
		'ui.vue3',
		'ui.vue3.components.hint',
		'ui.vue3.components.switcher',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];
