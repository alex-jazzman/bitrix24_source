<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/department-content.bundle.css',
	'js' => 'dist/department-content.bundle.js',
	'rel' => [
		'ui.icon-set.crm',
		'humanresources.company-structure.org-chart',
		'humanresources.company-structure.api',
		'humanresources.company-structure.permission-checker',
		'ui.entity-selector',
		'ui.notification',
		'ui.tooltip',
		'ui.buttons',
		'ui.icon-set.api.core',
		'ui.icon-set.main',
		'ui.avatar',
		'im.public.iframe',
		'humanresources.company-structure.utils',
		'humanresources.company-structure.structure-components',
		'main.core',
		'humanresources.company-structure.chart-store',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];
