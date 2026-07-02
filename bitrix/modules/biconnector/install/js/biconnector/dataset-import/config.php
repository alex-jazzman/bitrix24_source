<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => [
		'dist/dataset-import.bundle.css',
		'/bitrix/components/bitrix/ui.button.panel/templates/.default/style.css',
	],
	'js' => 'dist/dataset-import.bundle.js',
	'rel' => [
		'biconnector.dataset-import.file-export',
		'biconnector.popup',
		'main.core',
		'main.core.events',
		'main.loader',
		'main.popup',
		'ui.alerts',
		'ui.analytics',
		'ui.buttons',
		'ui.ears',
		'ui.entity-selector',
		'ui.forms',
		'ui.hint',
		'ui.icon-set.api.vue',
		'ui.icon-set.crm',
		'ui.icon-set.editor',
		'ui.layout-form',
		'ui.pinner',
		'ui.section',
		'ui.sidepanel',
		'ui.sidepanel.layout',
		'ui.switcher',
		'ui.uploader.stack-widget',
		'ui.vue3',
		'ui.vue3.directives.hint',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];

