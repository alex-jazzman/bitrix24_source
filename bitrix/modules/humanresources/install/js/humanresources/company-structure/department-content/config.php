<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/department-content.bundle.css',
	'js' => 'dist/department-content.bundle.js',
	'rel' => [
		'humanresources.company-structure.api',
		'humanresources.company-structure.chart-store',
		'humanresources.company-structure.org-chart',
		'humanresources.company-structure.permission-checker',
		'humanresources.company-structure.structure-components',
		'humanresources.company-structure.user-management-dialog',
		'humanresources.company-structure.utils',
		'im.public.iframe',
		'main.core',
		'main.core.events',
		'ui.avatar',
		'ui.buttons',
		'ui.entity-selector',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.crm',
		'ui.icon-set.main',
		'ui.notification',
		'ui.tooltip',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];
