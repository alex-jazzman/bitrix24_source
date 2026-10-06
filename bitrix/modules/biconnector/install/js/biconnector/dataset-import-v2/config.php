<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/dataset-import-v2.bundle.css',
	'js' => 'dist/dataset-import-v2.bundle.js',
	'rel' => [
		'biconnector.file-export',
		'main.core',
		'main.core.events',
		'main.popup',
		'main.sidepanel',
		'ui.analytics',
		'ui.buttons',
		'ui.hint',
		'ui.icon-set.api.core',
		'ui.sidepanel',
		'ui.system.dialog',
		'ui.vue3',
		'ui.vue3.vuex',
	],
	'skip_core' => false,
];
