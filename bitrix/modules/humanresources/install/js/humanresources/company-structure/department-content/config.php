<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/department-content.bundle.css',
	'js' => 'dist/department-content.bundle.js',
	'rel' => [
		'humanresources.company-structure.user-management-dialog',
		'ui.icon-set.crm',
		'humanresources.company-structure.api',
		'ui.entity-selector',
		'ui.tooltip',
		'ui.buttons',
		'humanresources.company-structure.permission-checker',
		'ui.icon-set.api.core',
		'ui.icon-set.main',
		'main.core.events',
		'ui.avatar',
		'humanresources.company-structure.org-chart',
		'humanresources.company-structure.utils',
		'ui.notification',
		'im.public.iframe',
		'humanresources.company-structure.structure-components',
		'main.core',
		'humanresources.company-structure.chart-store',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];
