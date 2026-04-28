<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/import.bundle.css',
	'js' => 'dist/import.bundle.js',
	'rel' => [
		'main.core.cache',
		'ui.system.typography.vue',
		'ui.entity-selector',
		'ui.uploader.tile-widget',
		'ui.uploader.core',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.icon-set.api.vue',
		'ui.system.alert',
		'ui.info-helper',
		'ui.icon-set.outline',
		'ui.analytics',
		'main.core',
		'ui.progressbar',
		'ui.notification',
		'crm.integration.analytics',
		'ui.vue3.components.button',
		'ui.vue3.components.popup',
		'main.core.events',
		'ui.vue3',
		'crm_common',
		'ui.design-tokens',
		'ui.forms',
	],
	'skip_core' => false,
];
