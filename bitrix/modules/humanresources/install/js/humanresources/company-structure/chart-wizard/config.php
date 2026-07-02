<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/chart-wizard.bundle.css',
	'js' => 'dist/chart-wizard.bundle.js',
	'rel' => [
		'humanresources.company-structure.api',
		'humanresources.company-structure.chart-store',
		'humanresources.company-structure.department-content',
		'humanresources.company-structure.permission-checker',
		'humanresources.company-structure.structure-components',
		'humanresources.company-structure.utils',
		'main.core',
		'main.core.cache',
		'main.loader',
		'ui.analytics',
		'ui.buttons',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.forms',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.crm',
		'ui.notification',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];