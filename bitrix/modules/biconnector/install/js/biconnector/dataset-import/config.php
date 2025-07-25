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
		'ui.pinner',
		'ui.section',
		'ui.alerts',
		'ui.hint',
		'ui.sidepanel.layout',
		'ui.icon-set.crm',
		'ui.switcher',
		'ui.uploader.stack-widget',
		'main.loader',
		'ui.ears',
		'main.popup',
		'ui.analytics',
		'ui.buttons',
		'ui.vue3',
		'ui.entity-selector',
		'ui.icon-set.api.vue',
		'ui.vue3.directives.hint',
		'main.core.events',
		'ui.vue3.vuex',
		'main.core',
		'ui.sidepanel',
		'biconnector.popup',
		'ui.forms',
		'ui.layout-form',
		'ui.icon-set.editor',
	],
	'skip_core' => false,
];

