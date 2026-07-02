<?php
if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'css' => 'dist/user-management-dialog.bundle.css',
	'js' => 'dist/user-management-dialog.bundle.js',
	'rel' => [
		'humanresources.company-structure.api',
		'humanresources.company-structure.chart-store',
		'humanresources.company-structure.utils',
		'main.core',
		'main.popup',
		'ui.entity-selector',
		'ui.notification',
	],
	'skip_core' => false,
];
