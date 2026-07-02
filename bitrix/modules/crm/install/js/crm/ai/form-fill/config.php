<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/ai-form-fill.bundle.css',
	'js' => 'dist/ai-form-fill.bundle.js',
	'rel' => [
		'crm.ai.call',
		'crm.ai.feedback',
		'crm.ai.name-service',
		'crm.integration.analytics',
		'crm.integration.ui.settings',
		'main.core',
		'ui.analytics',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.notification',
		'ui.vue3',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
