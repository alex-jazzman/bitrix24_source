<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/org-chart.bundle.css',
	'js' => 'dist/org-chart.bundle.js',
	'rel' => [
		'humanresources.company-structure.api',
		'humanresources.company-structure.chart-store',
		'humanresources.company-structure.chart-wizard',
		'humanresources.company-structure.department-content',
		'humanresources.company-structure.org-chart',
		'humanresources.company-structure.permission-checker',
		'humanresources.company-structure.structure-components',
		'humanresources.company-structure.user-management-dialog',
		'humanresources.company-structure.utils',
		'main.core',
		'main.core.events',
		'ui.analytics',
		'ui.buttons',
		'ui.canvas',
		'ui.confetti',
		'ui.design-tokens',
		'ui.dialogs.messagebox',
		'ui.entity-selector',
		'ui.forms',
		'ui.icon-set.api.core',
		'ui.icon-set.api.vue',
		'ui.icon-set.crm',
		'ui.icon-set.main',
		'ui.notification',
		'ui.vue3',
		'ui.vue3.pinia',
	],
	'skip_core' => false,
];