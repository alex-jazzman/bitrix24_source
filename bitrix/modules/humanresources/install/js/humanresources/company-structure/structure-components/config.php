<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/structure-components.bundle.css',
	'js' => 'dist/structure-components.bundle.js',
	'rel' => [
		'humanresources.company-structure.api',
		'humanresources.company-structure.chart-store',
		'humanresources.company-structure.permission-checker',
		'humanresources.company-structure.utils',
		'main.core',
		'main.popup',
		'ui.entity-selector',
		'ui.hint',
		'ui.icon-set.actions',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.notification',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];