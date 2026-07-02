<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/import.bundle.css',
	'js' => 'dist/import.bundle.js',
	'rel' => [
		'crm.integration.analytics',
		'crm_common',
		'main.core',
		'main.core.cache',
		'main.core.events',
		'ui.analytics',
		'ui.buttons',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.forms',
		'ui.icon-set.api.vue',
		'ui.icon-set.outline',
		'ui.info-helper',
		'ui.notification',
		'ui.progressbar',
		'ui.system.alert',
		'ui.system.typography.vue',
		'ui.uploader.core',
		'ui.uploader.tile-widget',
		'ui.vue3',
		'ui.vue3.components.button',
		'ui.vue3.components.popup',
	],
	'skip_core' => false,
];
